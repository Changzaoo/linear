import type { LeadForm, Project3D } from "./types";
import { priceOf } from "./pricingEngine";
import {
  CRM_ENDPOINTS,
  crmFetch,
  type CrmEstimate,
  type CrmProjectDoc,
  type CrmLeadCreated,
} from "../../shared/contract";

/* Tipos canônicos centralizados em src/shared/contract.ts.
   Re-exportados aqui para não quebrar imports existentes. */
export type {
  CrmEnvironment,
  CrmFurniture,
  CrmEstimate,
  CrmProjectDoc,
  CrmLeadCreated,
} from "../../shared/contract";

const MATERIAL_COLORS: Record<string, string> = {
  mdf_branco: "#f4f1e8",
  mdf_preto: "#171717",
  mdf_amadeirado: "#b88754",
  carvalho: "#c8a36a",
  nogueira: "#76513a",
  freijo: "#c79b62",
  laca: "#e8e5dc",
  marmore_escuro: "#252321",
  vidro: "#9fb7c8",
  metal: "#8c8f93",
};

function metersFromCm(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? Number((value / 100).toFixed(3)) : fallback;
}

function colorFor(material: string | undefined) {
  return material ? MATERIAL_COLORS[material] || "#D8B978" : "#D8B978";
}

function leadFromProject(project: Project3D): LeadForm {
  return {
    nome: project.client.name || "Cliente Estudio 3D",
    email: project.client.email || "sem-email@linea.invalid",
    whatsapp: project.client.phone || "000000000",
    cidade_estado: project.client.city || "Nao informado",
    tipo_projeto: project.client.projectType || project.environment.typeLabel || project.environment.type || "Projeto 3D",
    prazo: project.client.desiredDeadline || "A definir",
    faixa_orcamento: project.client.budgetRange || "Ainda nao sei",
    descricao: project.client.notes || project.name,
    aceite: project.client.contactConsent ?? true,
  };
}

export function isCrmNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { status?: number }).status === 404;
}

export function looksLikeCrmProjectId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function toCrmProjectDoc(project: Project3D): CrmProjectDoc {
  const env = project.environment;
  const projectType = project.client.projectType || env.typeLabel || env.type || "Projeto 3D";
  const notes = [
    project.client.notes?.trim(),
    project.estimate
      ? `Estimativa: R$ ${project.estimate.min.toLocaleString("pt-BR")} a R$ ${project.estimate.max.toLocaleString("pt-BR")}.`
      : "",
    `Status: ${project.status}. Origem: ${project.client.source || "Estudio 3D publico"}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const furniture = project.furniture.map((item) => {
    let preco = 0;
    try {
      preco = priceOf(item);
    } catch {
      preco = item.basePrice ?? 0;
    }
    return {
      uid: item.uid,
      catalogId: item.itemId,
      category: item.category,
      name: item.name,
      floor: item.floor ?? 0,
      x: Number((item.position?.[0] ?? 0).toFixed(3)),
      z: Number((item.position?.[2] ?? 0).toFixed(3)),
      rotation: Number((item.rotationY || 0).toFixed(4)),
      width: metersFromCm(item.width, 1),
      height: metersFromCm(item.height, 0.9),
      depth: metersFromCm(item.depth, 0.5),
      material: item.config?.material || "mdf_amadeirado",
      color: colorFor(item.config?.material),
      locked: !!item.locked,
      preco,
      ...(item.config?.modelUrl
        ? { modelUrl: item.config.modelUrl, modelFormat: item.config.modelFormat }
        : {}),
    };
  });

  const est = project.estimate;
  const estimativa: CrmEstimate | undefined = est
    ? {
        min: est.min,
        max: est.max,
        total: furniture.reduce((sum, f) => sum + (f.preco || 0), 0),
        complexity: est.complexity,
        prazoDias: est.deadlineDays,
        qtdMoveis: furniture.length,
      }
    : undefined;

  return {
    projectName: project.name || projectType,
    notes,
    status: project.status,
    leadScore: project.leadScore,
    estimativa,
    environment: {
      largura: metersFromCm(env.width, 6),
      comprimento: metersFromCm(env.depth, 5),
      peDireito: metersFromCm(env.height, 2.7),
      tipo: projectType,
      formato: Math.abs(env.width - env.depth) < 20 ? "quadrado" : "retangular",
      andares: Math.max(1, Math.round(env.floors || 1)),
      portas: env.hasDoors ? 1 : 0,
      janelas: env.hasWindows ? 1 : 0,
    },
    furniture,
  };
}

export function createCrmLead(form: LeadForm, project: Project3D): Promise<CrmLeadCreated> {
  return crmFetch<CrmLeadCreated>(CRM_ENDPOINTS.leads3d, {
    method: "POST",
    body: JSON.stringify({ ...form, doc: toCrmProjectDoc(project) }),
  });
}

export function createCrmLeadFromProject(project: Project3D): Promise<CrmLeadCreated> {
  return createCrmLead(leadFromProject(project), project);
}

export function saveCrmProject(project: Project3D): Promise<unknown> {
  return crmFetch(CRM_ENDPOINTS.projeto(project.id), {
    method: "PUT",
    body: JSON.stringify({
      doc: toCrmProjectDoc(project),
      nome: project.name,
      status: project.status,
    }),
  });
}

export function sendCrmProjectForAnalysis(project: Project3D): Promise<{ ok: boolean }> {
  return crmFetch<{ ok: boolean }>(CRM_ENDPOINTS.enviar(project.id), {
    method: "POST",
    body: JSON.stringify({ doc: toCrmProjectDoc(project) }),
  });
}

export function callCrmArchitect(project: Project3D): Promise<{ ok: boolean }> {
  return crmFetch<{ ok: boolean }>(CRM_ENDPOINTS.chamarArquiteto(project.id), {
    method: "POST",
    body: JSON.stringify({}),
  });
}
