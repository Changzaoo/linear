/* ============================================================
   Solicitar proposta — formulário público que cai direto na
   fileira "Lead" do funil comercial do CRM.

   Fluxo: o formulário POSTa em /public/solicitar-proposta no CRM,
   que grava o lead (persistente). Quando o time abre o Funil
   comercial, o lead é sincronizado para a coluna "Lead".

   Base da API, endpoints e tipos vêm do contrato compartilhado
   (src/shared/contract.ts) — fonte única landing ↔ CRM.
   ============================================================ */
import { createStore, useStore } from "./tinyStore";
import { CRM_ENDPOINTS, crmFetch, type ProposalForm, type ProposalCreated } from "../shared/contract";

export type { ProposalForm } from "../shared/contract";

export async function solicitarProposta(form: ProposalForm): Promise<ProposalCreated> {
  return crmFetch<ProposalCreated>(CRM_ENDPOINTS.solicitarProposta, {
    method: "POST",
    body: JSON.stringify(form),
  });
}

/* ---------- portão do modal (abre de qualquer CTA do site) ---------- */
const gate = createStore<{ open: boolean }>({ open: false });
export const openProposal = () => gate.setState({ open: true });
export const closeProposal = () => gate.setState({ open: false });
export const useProposalOpen = () => useStore(gate, (s) => s.open);
