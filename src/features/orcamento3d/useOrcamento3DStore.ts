/* ============================================================
   Store do Orçamento 3D — documento do projeto + histórico
   (undo/redo), seleção, modo de visão, snap e autosave.
   ============================================================ */
import { createStore, useStore } from "../../lib/tinyStore";
import type {
  PlacedFurniture,
  EnvironmentConfig,
  ClientInfo,
  Estimate,
  LeadScore,
  ProjectStatus,
  ViewMode,
  FurnitureItem,
  ChatMessage,
} from "./types";
import { defaultEnvironment, ENV_LIMITS } from "./environmentTemplates";
import { defaultConfigFor } from "./furnitureCatalog";
import { estimateProject, scoreLead, furnitureOutOfBounds } from "./pricingEngine";

export const uid = () => Math.random().toString(36).slice(2, 10);
const AUTOSAVE_KEY = "orc3d:autosave:v1";

/** Documento editável — é o que entra no histórico de undo/redo. */
export interface Doc {
  name: string;
  environment: EnvironmentConfig;
  furniture: PlacedFurniture[];
  client: ClientInfo;
}

interface SnapConfig {
  enabled: boolean;
  floor: boolean;
  wall: boolean;
  corner: boolean;
  furniture: boolean;
  grid: boolean;
}

export interface EditorState {
  phase: "setup" | "editing";
  doc: Doc;
  projectId: string;
  estimate: Estimate;
  leadScore: LeadScore;
  status: ProjectStatus;
  assistedByArchitect: boolean;
  attendanceId?: string;
  thumbnail?: string;
  selectedUid: string | null;
  role: "cliente" | "arquiteto";
  viewMode: ViewMode;
  snap: SnapConfig;
  gridVisible: boolean;
  warning: string | null;
  chat: ChatMessage[];
  past: Doc[];
  future: Doc[];
  requestedQuote: boolean;
  saved: boolean;
}

function emptyClient(): ClientInfo {
  return { name: "", phone: "", email: "", city: "", notes: "" };
}

function freshDoc(): Doc {
  return {
    name: "Meu projeto",
    environment: defaultEnvironment(),
    furniture: [],
    client: emptyClient(),
  };
}

function initialState(): EditorState {
  const doc = freshDoc();
  return {
    phase: "setup",
    doc,
    projectId: uid(),
    estimate: estimateProject(doc.furniture, doc.environment),
    leadScore: "frio",
    status: "rascunho",
    assistedByArchitect: false,
    selectedUid: null,
    role: "cliente",
    viewMode: "isometrico",
    snap: { enabled: true, floor: true, wall: true, corner: true, furniture: true, grid: false },
    gridVisible: true,
    warning: null,
    chat: [],
    past: [],
    future: [],
    requestedQuote: false,
    saved: false,
  };
}

export const orc3dStore = createStore<EditorState>(initialState());

/* ---------- derivações ---------- */
function recompute(s: EditorState): Partial<EditorState> {
  const estimate = estimateProject(s.doc.furniture, s.doc.environment);
  const leadScore = scoreLead(s.doc.furniture, s.doc.environment, estimate, {
    askedArchitect: s.assistedByArchitect,
    saved: s.saved,
    requestedQuote: s.requestedQuote,
  });
  const out = furnitureOutOfBounds(s.doc.furniture, s.doc.environment);
  return {
    estimate,
    leadScore,
    warning: out.length ? "Essa medida parece ultrapassar o espaço disponível." : null,
  };
}

const clone = (d: Doc): Doc => JSON.parse(JSON.stringify(d));

/** True enquanto um doc remoto está sendo aplicado — o bridge usa para
    não reemitir (evita ping-pong na sincronização). */
let applyingRemote = false;
export const isApplyingRemote = () => applyingRemote;

function autosave(s: EditorState) {
  try {
    localStorage.setItem(
      AUTOSAVE_KEY,
      JSON.stringify({ doc: s.doc, projectId: s.projectId, savedAt: new Date().toISOString() })
    );
  } catch {
    /* quota cheia: ignora */
  }
}

/** Aplica mudança ao doc registrando no histórico (1 entrada por ação). */
function pushHistory() {
  const s = orc3dStore.getState();
  orc3dStore.setState({ past: [...s.past.slice(-49), clone(s.doc)], future: [] });
}

function commitDoc(mutate: (d: Doc) => void, recordHistory = true) {
  const s = orc3dStore.getState();
  if (recordHistory) pushHistory();
  const doc = clone(orc3dStore.getState().doc);
  mutate(doc);
  orc3dStore.setState((cur) => ({ doc }));
  const ns = orc3dStore.getState();
  orc3dStore.setState(recompute(ns));
  autosave(orc3dStore.getState());
}

/* ---------- ações públicas ---------- */
export const actions = {
  reset() {
    orc3dStore.setState(initialState());
  },

  setEnvironment(env: EnvironmentConfig) {
    commitDoc((d) => {
      d.environment = env;
    });
  },

  enterEditor() {
    orc3dStore.setState({ phase: "editing" });
  },

  setAssisted(v: boolean) {
    orc3dStore.setState({ assistedByArchitect: v });
    orc3dStore.setState(recompute(orc3dStore.getState()));
  },

  setProjectName(name: string) {
    commitDoc((d) => {
      d.name = name.slice(0, 80);
    }, false);
  },

  setClient(patch: Partial<ClientInfo>) {
    commitDoc((d) => {
      d.client = { ...d.client, ...patch };
    }, false);
  },

  addFurniture(item: FurnitureItem) {
    const s = orc3dStore.getState();
    if (s.doc.furniture.length >= ENV_LIMITS.maxFurniture) {
      orc3dStore.setState({ warning: "Limite de móveis por projeto atingido." });
      return;
    }
    const mountY = item.grounded ? 0 : (item.mountHeight ?? 150) / 100;
    const newUid = uid();
    commitDoc((d) => {
      d.furniture.push({
        uid: newUid,
        itemId: item.id,
        name: item.name,
        category: item.category,
        width: item.defaultWidth,
        height: item.defaultHeight,
        depth: item.defaultDepth,
        position: [0, mountY, 0],
        rotationY: 0,
        locked: false,
        config: defaultConfigFor(item),
        basePrice: item.basePrice,
        complexity: item.complexity,
      });
    });
    orc3dStore.setState({ selectedUid: newUid });
  },

  select(uidSel: string | null) {
    orc3dStore.setState({ selectedUid: uidSel });
  },

  updateFurniture(uidSel: string, patch: Partial<PlacedFurniture>, history = true) {
    commitDoc((d) => {
      const f = d.furniture.find((x) => x.uid === uidSel);
      if (f) Object.assign(f, patch);
    }, history);
  },

  updateConfig(uidSel: string, patch: Partial<PlacedFurniture["config"]>) {
    commitDoc((d) => {
      const f = d.furniture.find((x) => x.uid === uidSel);
      if (f) f.config = { ...f.config, ...patch };
    });
  },

  /** Move sem histórico (durante o arraste). Chame beginDrag() antes. */
  moveTo(uidSel: string, position: [number, number, number]) {
    commitDoc((d) => {
      const f = d.furniture.find((x) => x.uid === uidSel);
      if (f && !f.locked) f.position = position;
    }, false);
  },

  beginDrag() {
    pushHistory();
  },

  rotate(uidSel: string, deltaRad: number) {
    commitDoc((d) => {
      const f = d.furniture.find((x) => x.uid === uidSel);
      if (f && !f.locked) f.rotationY += deltaRad;
    });
  },

  duplicate(uidSel: string) {
    const s = orc3dStore.getState();
    if (s.doc.furniture.length >= ENV_LIMITS.maxFurniture) return;
    const src = s.doc.furniture.find((x) => x.uid === uidSel);
    if (!src) return;
    const newUid = uid();
    commitDoc((d) => {
      const copy: PlacedFurniture = JSON.parse(JSON.stringify(src));
      copy.uid = newUid;
      copy.position = [src.position[0] + 0.4, src.position[1], src.position[2] + 0.4];
      copy.locked = false;
      d.furniture.push(copy);
    });
    orc3dStore.setState({ selectedUid: newUid });
  },

  remove(uidSel: string) {
    commitDoc((d) => {
      d.furniture = d.furniture.filter((x) => x.uid !== uidSel);
    });
    if (orc3dStore.getState().selectedUid === uidSel) orc3dStore.setState({ selectedUid: null });
  },

  toggleLock(uidSel: string) {
    commitDoc((d) => {
      const f = d.furniture.find((x) => x.uid === uidSel);
      if (f) f.locked = !f.locked;
    });
  },

  setNote(uidSel: string, note: string) {
    commitDoc((d) => {
      const f = d.furniture.find((x) => x.uid === uidSel);
      if (f) f.note = note.slice(0, 400);
    }, false);
  },

  alignToWall(uidSel: string) {
    const s = orc3dStore.getState();
    const f = s.doc.furniture.find((x) => x.uid === uidSel);
    if (!f) return;
    const halfD = s.doc.environment.depth / 200;
    const back = -(halfD - f.depth / 200 - 0.02);
    commitDoc((d) => {
      const t = d.furniture.find((x) => x.uid === uidSel);
      if (t && !t.locked) {
        t.position = [t.position[0], t.position[1], back];
        t.rotationY = 0;
      }
    });
  },

  snapToCorner(uidSel: string) {
    const s = orc3dStore.getState();
    const f = s.doc.furniture.find((x) => x.uid === uidSel);
    if (!f) return;
    const halfW = s.doc.environment.width / 200;
    const halfD = s.doc.environment.depth / 200;
    const x = -(halfW - f.width / 200 - 0.02);
    const z = -(halfD - f.depth / 200 - 0.02);
    commitDoc((d) => {
      const t = d.furniture.find((y) => y.uid === uidSel);
      if (t && !t.locked) t.position = [x, t.position[1], z];
    });
  },

  center(uidSel: string) {
    commitDoc((d) => {
      const t = d.furniture.find((y) => y.uid === uidSel);
      if (t && !t.locked) t.position = [0, t.position[1], 0];
    });
  },

  setViewMode(mode: ViewMode) {
    orc3dStore.setState({ viewMode: mode });
  },

  setSnap(patch: Partial<SnapConfig>) {
    orc3dStore.setState((s) => ({ snap: { ...s.snap, ...patch } }));
  },

  toggleGrid() {
    orc3dStore.setState((s) => ({ gridVisible: !s.gridVisible }));
  },

  undo() {
    const s = orc3dStore.getState();
    if (!s.past.length) return;
    const previous = s.past[s.past.length - 1];
    orc3dStore.setState({
      past: s.past.slice(0, -1),
      future: [clone(s.doc), ...s.future].slice(0, 50),
      doc: previous,
    });
    orc3dStore.setState(recompute(orc3dStore.getState()));
    autosave(orc3dStore.getState());
  },

  redo() {
    const s = orc3dStore.getState();
    if (!s.future.length) return;
    const next = s.future[0];
    orc3dStore.setState({
      past: [...s.past, clone(s.doc)],
      future: s.future.slice(1),
      doc: next,
    });
    orc3dStore.setState(recompute(orc3dStore.getState()));
    autosave(orc3dStore.getState());
  },

  startFromScratch() {
    const doc = freshDoc();
    doc.environment = orc3dStore.getState().doc.environment; // mantém o ambiente
    orc3dStore.setState({
      doc,
      past: [],
      future: [],
      selectedUid: null,
      requestedQuote: false,
      saved: false,
    });
    orc3dStore.setState(recompute(orc3dStore.getState()));
  },

  setThumbnail(dataUrl: string) {
    orc3dStore.setState({ thumbnail: dataUrl });
  },

  markSaved() {
    orc3dStore.setState({ saved: true });
    orc3dStore.setState(recompute(orc3dStore.getState()));
  },

  markQuoteRequested() {
    orc3dStore.setState({ requestedQuote: true, status: "orcamento-solicitado" });
    orc3dStore.setState(recompute(orc3dStore.getState()));
  },

  setAttendanceId(id: string) {
    orc3dStore.setState({ attendanceId: id });
  },

  /** Aplica um doc vindo do colaborador remoto, sem reemitir. */
  applyRemoteDoc(doc: Doc) {
    applyingRemote = true;
    orc3dStore.setState({ doc });
    orc3dStore.setState(recompute(orc3dStore.getState()));
    applyingRemote = false;
  },

  /** Carrega um projeto existente (ex.: arquiteto abrindo pelo CRM). */
  loadProject(project: import("./types").Project3D, attendanceId?: string) {
    orc3dStore.setState({
      phase: "editing",
      projectId: project.id,
      doc: {
        name: project.name,
        environment: project.environment,
        furniture: project.furniture,
        client: project.client,
      },
      status: project.status,
      assistedByArchitect: project.assistedByArchitect,
      attendanceId,
      thumbnail: project.thumbnail,
      role: "arquiteto",
      past: [],
      future: [],
      selectedUid: null,
      saved: true,
    });
    orc3dStore.setState(recompute(orc3dStore.getState()));
  },

  setStatus(status: ProjectStatus) {
    orc3dStore.setState({ status });
  },

  addChat(msg: ChatMessage) {
    orc3dStore.setState((s) => ({ chat: [...s.chat, msg] }));
  },

  setChat(messages: ChatMessage[]) {
    orc3dStore.setState({ chat: messages });
  },

  /** Restaura um autosave encontrado. */
  loadAutosave(): boolean {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { doc: Doc; projectId: string };
      if (!parsed?.doc) return false;
      orc3dStore.setState({
        doc: parsed.doc,
        projectId: parsed.projectId ?? uid(),
        past: [],
        future: [],
        phase: "editing",
      });
      orc3dStore.setState(recompute(orc3dStore.getState()));
      return true;
    } catch {
      return false;
    }
  },

  hasAutosave(): boolean {
    try {
      return !!localStorage.getItem(AUTOSAVE_KEY);
    } catch {
      return false;
    }
  },

  clearAutosave() {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch {
      /* noop */
    }
  },
};

/** Monta o Project3D persistível a partir do estado atual. */
export function buildProject3D(): import("./types").Project3D {
  const s = orc3dStore.getState();
  const now = new Date().toISOString();
  return {
    id: s.projectId,
    name: s.doc.name,
    client: s.doc.client,
    environment: s.doc.environment,
    furniture: s.doc.furniture,
    estimate: s.estimate,
    leadScore: s.leadScore,
    status: s.status,
    thumbnail: s.thumbnail,
    assistedByArchitect: s.assistedByArchitect,
    createdAt: now,
    updatedAt: now,
  };
}

/* ---------- hooks de seleção ---------- */
export function useOrc3d<S>(selector: (s: EditorState) => S): S {
  return useStore(orc3dStore, selector);
}

export function useSelectedFurniture(): PlacedFurniture | null {
  return useOrc3d((s) => s.doc.furniture.find((f) => f.uid === s.selectedUid) ?? null);
}

/* ============================================================
   Portão do estúdio — abre/fecha o editor sobre o site.
   ============================================================ */
interface GateState {
  open: boolean;
}
export const studioGate = createStore<GateState>({ open: false });
export const openStudio = () => studioGate.setState({ open: true });
export const closeStudio = () => studioGate.setState({ open: false });
export function useStudioOpen(): boolean {
  return useStore(studioGate, (s) => s.open);
}
