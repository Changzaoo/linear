import type { ProjectStatus } from "../../features/orcamento3d/types";

export const STATUS_META: Record<ProjectStatus, { label: string; cls: string }> = {
  "novo-lead-3d": { label: "Novo Lead 3D", cls: "bg-champagne/15 text-champagne border-champagne/40" },
  rascunho: { label: "Rascunho", cls: "bg-zinc-500/15 text-zinc-300 border-zinc-400/30" },
  "aguardando-arquiteto": { label: "Aguardando arquiteto", cls: "bg-rose-500/15 text-rose-300 border-rose-400/40" },
  "em-atendimento": { label: "Em atendimento", cls: "bg-sky-500/15 text-sky-300 border-sky-400/40" },
  "projeto-em-edicao": { label: "Projeto em edição", cls: "bg-indigo-500/15 text-indigo-300 border-indigo-400/40" },
  "orcamento-solicitado": { label: "Orçamento solicitado", cls: "bg-amber-500/15 text-amber-300 border-amber-400/40" },
  "projeto-3d-enviado-analise": { label: "Projeto 3D em análise", cls: "bg-orange-500/15 text-orange-300 border-orange-400/40" },
  "orcamento-enviado": { label: "Orçamento enviado", cls: "bg-teal-500/15 text-teal-300 border-teal-400/40" },
  "em-negociacao": { label: "Em negociação", cls: "bg-violet-500/15 text-violet-300 border-violet-400/40" },
  fechado: { label: "Fechado", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40" },
  perdido: { label: "Perdido", cls: "bg-red-500/15 text-red-300 border-red-400/40" },
  arquivado: { label: "Arquivado", cls: "bg-zinc-700/30 text-zinc-400 border-zinc-500/30" },
};

export const SCORE_META: Record<string, { label: string; cls: string }> = {
  frio: { label: "Frio", cls: "bg-sky-500/15 text-sky-300" },
  morno: { label: "Morno", cls: "bg-amber-500/15 text-amber-300" },
  quente: { label: "Quente", cls: "bg-rose-500/15 text-rose-300" },
  "projeto-grande": { label: "Projeto grande", cls: "bg-champagne/15 text-champagne" },
};
