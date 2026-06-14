/* ============================================================
   Solicitar proposta — formulário público que cai direto na
   fileira "Lead" do funil comercial do CRM.

   Fluxo: o formulário POSTa em /public/solicitar-proposta no CRM,
   que grava o lead (persistente). Quando o time abre o Funil
   comercial, o lead é sincronizado para a coluna "Lead".
   ============================================================ */
import { createStore, useStore } from "./tinyStore";

export interface ProposalForm {
  nome: string;
  email: string;
  whatsapp: string;
  cidade_estado: string;
  tipo_projeto: string;
  mensagem: string;
  aceite: boolean;
}

const CRM_API_BASE = (
  import.meta.env.VITE_CRM_API_BASE_URL?.trim() || "https://crm-marcenaria.vercel.app/api"
).replace(/\/+$/, "");

export async function solicitarProposta(form: ProposalForm): Promise<{ leadId: string }> {
  const res = await fetch(`${CRM_API_BASE}/public/solicitar-proposta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = (data && (data.erro || data.error)) || `O servidor retornou ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : "Falha ao enviar sua solicitação.");
  }
  return data;
}

/* ---------- portão do modal (abre de qualquer CTA do site) ---------- */
const gate = createStore<{ open: boolean }>({ open: false });
export const openProposal = () => gate.setState({ open: true });
export const closeProposal = () => gate.setState({ open: false });
export const useProposalOpen = () => useStore(gate, (s) => s.open);
