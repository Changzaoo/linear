/* ============================================================
   Contrato de integração landing ↔ CRM (NEXUS).

   FONTE ÚNICA do contrato público entre a landing e o CRM.
   Antes, a base da API e os tipos de integração viviam duplicados
   em `src/lib/proposal.ts` e `src/features/orcamento3d/crmPublicApi.ts`.
   Tudo o que cruza a fronteira site ⇄ CRM deve ser declarado aqui.
   ============================================================ */

/* ---------- base da API ---------- */
export const CRM_API_BASE = (
  import.meta.env.VITE_CRM_API_BASE_URL?.trim() || "https://crm-marcenaria.vercel.app/api"
).replace(/\/+$/, "");

/* ---------- endpoints públicos ---------- */
export const CRM_ENDPOINTS = {
  /** POST — cria lead a partir de um projeto do Estúdio 3D */
  leads3d: "/public/leads-3d",
  /** POST — formulário "solicitar proposta" (cai na fileira Lead do funil) */
  solicitarProposta: "/public/solicitar-proposta",
  /** PUT — atualiza o documento de um projeto 3D existente */
  projeto: (id: string) => `/public/projetos-3d/${id}`,
  /** POST — envia o projeto 3D para análise da equipe */
  enviar: (id: string) => `/public/projetos-3d/${id}/enviar`,
  /** POST — chama um arquiteto para a sessão ao vivo */
  chamarArquiteto: (id: string) => `/public/projetos-3d/${id}/chamar-arquiteto`,
  /** POST — heartbeat de presença da sessão colaborativa */
  sessaoHeartbeat: (id: string) => `/public/sessoes-3d/${id}/heartbeat`,
  /** GET — estado atual da sessão colaborativa */
  sessaoState: (id: string) => `/public/sessoes-3d/${id}/state`,
  /** PUT — documento canônico da sessão colaborativa */
  sessaoDoc: (id: string) => `/public/sessoes-3d/${id}/doc`,
  /** POST — sinaliza saída de um participante da sessão */
  sessaoLeave: (id: string) => `/public/sessoes-3d/${id}/leave`,

  /* ----- Portal do Cliente (área reservada p/ envio de arquivos) ----- */
  /** GET — valida o código e retorna o lead + arquivos já enviados */
  portal: (token: string) => `/public/portal/${token}`,
  /** POST (multipart) — envia um ou mais arquivos do cliente */
  portalArquivos: (token: string) => `/public/portal/${token}/arquivos`,
  /** GET — baixa/visualiza um arquivo enviado (também usado pelo CRM) */
  portalArquivo: (token: string, arquivoId: string) =>
    `/public/portal/${token}/arquivos/${arquivoId}`,

  /** POST — Assistente de IA (chat do site). Toda conversa cai no CRM. */
  chat: "/public/chat",
} as const;

/* ---------- tipos canônicos do documento 3D ---------- */
export type CrmEnvironment = {
  largura: number;
  comprimento: number;
  peDireito: number;
  tipo: string;
  formato: "retangular" | "quadrado" | "L";
  andares: number;
  portas: number;
  janelas: number;
};

export type CrmFurniture = {
  uid: string;
  catalogId: string;
  category: string;
  name: string;
  floor: number;
  x: number;
  z: number;
  rotation: number;
  width: number;
  height: number;
  depth: number;
  material: string;
  color: string;
  locked: boolean;
  /** preço estimado da peça (R$) — alimenta o resumo do funil */
  preco: number;
  /** modelo 3D importado (data URL) — quando presente, substitui a geometria */
  modelUrl?: string;
  modelFormat?: string;
};

/** Resumo financeiro/qualificação enviado junto ao doc — usado pelo
    funil comercial do CRM (card do lead com valores e prioridade). */
export type CrmEstimate = {
  min: number;
  max: number;
  total: number;
  complexity: string;
  prazoDias: [number, number];
  qtdMoveis: number;
};

export type CrmProjectDoc = {
  environment: CrmEnvironment;
  furniture: CrmFurniture[];
  notes: string;
  projectName: string;
  /** estimativa de valores do projeto (opcional p/ compatibilidade) */
  estimativa?: CrmEstimate;
  /** classificação automática do lead (frio/morno/quente/projeto-grande) */
  leadScore?: string;
  /** status do projeto no momento do envio */
  status?: string;
};

export type CrmLeadCreated = {
  leadId: string;
  projetoId: string;
  /** código de acompanhamento que dá acesso ao Portal do Cliente */
  token: string;
};

/** Resposta do formulário "Solicitar proposta" (sem projeto 3D). */
export type ProposalCreated = {
  leadId: string;
  /** código de acompanhamento que dá acesso ao Portal do Cliente */
  token: string;
};

/* ---------- Portal do Cliente: envio de arquivos técnicos ---------- */

/** Categorias de documento que o cliente pode enviar para a marcenaria
    analisar/executar. Espelhadas no CRM (server/src/shared/contract.js). */
export const ARQUIVO_CATEGORIAS = [
  { key: "planta_baixa", label: "Planta baixa", hint: "Paredes, ambientes, cotas e mobiliário fixo." },
  { key: "layout", label: "Planta de layout / leiaute", hint: "Disposição de todos os móveis e circulação." },
  { key: "cortes", label: "Cortes e seções", hint: "Alturas, pé-direito e níveis (cortes AA, BB)." },
  { key: "vistas", label: "Vistas / elevações", hint: "Paredes vistas de frente — bancadas, nichos, painéis." },
  { key: "forro", label: "Planta de forro / cobertura", hint: "Forro, sancas, iluminação e teto." },
  { key: "eletrica_hidraulica", label: "Elétrica / hidráulica", hint: "Tomadas e pontos de água/gás (furos e recortes)." },
  { key: "detalhamento", label: "Detalhamento / executivo de marcenaria", hint: "Desenho das peças, chapas, ferragens e acabamentos." },
  { key: "modelo_3d", label: "Modelo 3D", hint: "SKP, GLB, OBJ, FBX, STL, Revit/IFC, Rhino…" },
  { key: "render_foto", label: "Renders / fotos do local", hint: "Imagens de referência e fotos do ambiente atual." },
  { key: "memorial", label: "Memorial / outros documentos", hint: "Memorial descritivo, mapa de acabamentos, planilhas." },
] as const;

export type ArquivoCategoria = (typeof ARQUIVO_CATEGORIAS)[number]["key"];

/** Extensões aceitas no Portal do Cliente (validadas também no CRM). */
export const ARQUIVO_EXTENSOES_ACEITAS = [
  ".pdf",
  ".dwg", ".dxf",
  ".skp", ".rvt", ".ifc", ".3dm",
  ".glb", ".gltf", ".obj", ".fbx", ".stl", ".3ds", ".dae",
  ".png", ".jpg", ".jpeg", ".webp", ".gif",
  ".xlsx", ".xls", ".docx", ".doc", ".csv", ".txt",
  ".zip",
] as const;

/** Limite por arquivo (bytes). Generoso por causa de modelos 3D (SKP/FBX). */
export const ARQUIVO_MAX_BYTES = 60 * 1024 * 1024; // 60 MB

/** Metadados de um arquivo enviado pelo cliente (sem o binário). */
export type PortalArquivo = {
  id: string;
  categoria: ArquivoCategoria | string;
  /** rótulo legível da categoria */
  categoriaLabel?: string;
  /** nome original do arquivo */
  nome: string;
  /** mime type */
  tipo: string;
  /** tamanho em bytes */
  tamanho: number;
  /** data de envio (ISO) */
  criadoEm: string;
};

/** Dados do lead retornados ao abrir o Portal do Cliente. */
export type PortalLead = {
  nome: string;
  tipoProjeto?: string;
  status?: string;
  projetoId?: string;
  criadoEm?: string;
};

/** Estado completo do Portal do Cliente (lead + arquivos enviados). */
export type PortalState = {
  lead: PortalLead;
  arquivos: PortalArquivo[];
};

/* ---------- Assistente de IA (chat do site) ---------- */

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

/** Corpo do POST para o chat. */
export type ChatRequest = {
  messages: ChatMessage[];
  /** id da conversa para continuar (devolvido na 1ª resposta) */
  conversaId?: string;
  /** página/origem de onde o chat foi aberto */
  origem?: string;
};

/** Resposta do agente de IA. */
export type ChatResponse = {
  reply: string;
  /** true quando o agente registrou um lead nesta conversa */
  registered?: boolean;
  /** id da conversa (guardar para continuar) */
  conversaId: string;
  /** código de acompanhamento, quando um lead é criado */
  token?: string | null;
};

/* ---------- formulários públicos ---------- */

/** Formulário "Solicitar proposta" (CTA do site → fileira Lead do funil). */
export type ProposalForm = {
  nome: string;
  email: string;
  whatsapp: string;
  cidade_estado: string;
  tipo_projeto: string;
  prazo?: string;
  faixa_orcamento?: string;
  mensagem?: string;
  aceite: boolean;
};

/** Formulário de lead gerado pelo Estúdio 3D (acompanha o doc do projeto). */
export type LeadForm = {
  nome: string;
  email: string;
  whatsapp: string;
  cidade_estado: string;
  tipo_projeto: string;
  prazo?: string;
  faixa_orcamento?: string;
  descricao?: string;
  aceite: boolean;
};

/* ---------- helper de fetch tipado ---------- */

/** Resposta de erro do CRM com status/payload anexados, para que os
    chamadores possam diferenciar (ex.: 404) sem inspecionar strings. */
export interface CrmError extends Error {
  status?: number;
  data?: unknown;
}

function ensureOk(res: Response, data: unknown): void {
  if (res.ok) return;
  const errorData = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const message =
    (typeof errorData.erro === "string" && errorData.erro) ||
    (typeof errorData.error === "string" && errorData.error) ||
    `CRM retornou ${res.status}`;
  const err: CrmError = Object.assign(new Error(message), { status: res.status, data });
  throw err;
}

/** Fetch tipado para a API pública do CRM. Faz o parse seguro do corpo
    (JSON quando possível, texto caso contrário) e levanta um CrmError
    com status/payload quando a resposta não é OK. */
export async function crmFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${CRM_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  ensureOk(res, data);
  return data as T;
}

/** Envia multipart/form-data para o CRM (upload de arquivos). NÃO define
    Content-Type manualmente — o browser monta o boundary do FormData. */
export async function crmUpload<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${CRM_API_BASE}${path}`, { method: "POST", body });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  ensureOk(res, data);
  return data as T;
}

/** URL absoluta para baixar/visualizar um arquivo do Portal do Cliente. */
export function crmFileUrl(token: string, arquivoId: string): string {
  return `${CRM_API_BASE}${CRM_ENDPOINTS.portalArquivo(token, arquivoId)}`;
}
