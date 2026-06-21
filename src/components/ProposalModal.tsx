import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { closeProposal, solicitarProposta, useProposalOpen, type ProposalForm } from "../lib/proposal";
import { track } from "../lib/analytics";

const TIPOS = [
  "Loja / varejo",
  "Quiosque",
  "Escritório corporativo",
  "Restaurante / café",
  "Clínica / consultório",
  "Hotel / hospitalidade",
  "Showroom",
  "Cozinha planejada",
  "Projeto residencial",
  "Outro",
];

const EMPTY: ProposalForm = {
  nome: "",
  email: "",
  whatsapp: "",
  cidade_estado: "",
  tipo_projeto: "Loja / varejo",
  mensagem: "",
  aceite: false,
};

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validPhone = (v: string) => /\d{8,}/.test(v.replace(/\D/g, ""));

const inputCls =
  "w-full rounded-lg border border-champagne/20 bg-background/60 px-3 py-2.5 text-sm text-text outline-none transition focus:border-champagne/50";

export default function ProposalModal() {
  const open = useProposalOpen();
  const [form, setForm] = useState<ProposalForm>(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;
  const errorId = id("error");
  const titleId = id("title");

  // reinicia ao abrir
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError("");
      setDone(false);
      setSubmitting(false);
      track("proposal_open");
    }
  }, [open]);

  // fecha com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProposal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const set = (key: keyof ProposalForm, value: string | boolean) =>
    setForm((cur) => ({ ...cur, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.nome.trim()) return setError("Informe seu nome completo.");
    if (!validPhone(form.whatsapp)) return setError("Informe um WhatsApp válido.");
    if (!validEmail(form.email)) return setError("Informe um e-mail válido.");
    if (!form.aceite) return setError("É necessário aceitar o contato da equipe.");
    setError("");
    setSubmitting(true);
    try {
      await solicitarProposta(form);
      track("proposal_submit", { tipo_projeto: form.tipo_projeto });
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Não foi possível enviar agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-background/85 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeProposal}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-lg rounded-2xl border border-champagne/20 bg-surface p-6 shadow-card sm:p-8"
          >
            <button
              onClick={closeProposal}
              aria-label="Fechar"
              className="absolute right-4 top-4 text-muted transition hover:text-text"
            >
              ✕
            </button>

            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-champagne/40 bg-champagne/10 text-2xl text-champagne">
                  ✓
                </div>
                <h2 className="font-display text-2xl text-text">Solicitação enviada!</h2>
                <p className="mt-3 text-sm text-muted">
                  Recebemos seu pedido de proposta. Nossa equipe comercial entrará em contato em breve
                  pelo WhatsApp ou e-mail informado.
                </p>
                <button onClick={closeProposal} className="btn-primary mt-6">
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="mb-5">
                  <p className="text-[11px] uppercase tracking-widest2 text-champagne/80">Solicitar proposta</p>
                  <h2 id={titleId} className="mt-2 font-display text-2xl italic text-text">
                    Conte sobre seu projeto e receba uma proposta personalizada.
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Preencha os dados abaixo. Sua solicitação cai direto no nosso atendimento comercial.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block" htmlFor={id("nome")}>
                    <span className="mb-1 block text-xs text-muted">Nome completo</span>
                    <input id={id("nome")} name="nome" autoComplete="name" required value={form.nome} onChange={(e) => set("nome", e.target.value)} aria-describedby={error ? errorId : undefined} className={inputCls} />
                  </label>
                  <label className="block" htmlFor={id("whatsapp")}>
                    <span className="mb-1 block text-xs text-muted">WhatsApp</span>
                    <input id={id("whatsapp")} name="whatsapp" autoComplete="tel" required value={form.whatsapp} inputMode="tel" onChange={(e) => set("whatsapp", e.target.value)} aria-describedby={error ? errorId : undefined} className={inputCls} />
                  </label>
                  <label className="block" htmlFor={id("email")}>
                    <span className="mb-1 block text-xs text-muted">E-mail</span>
                    <input id={id("email")} name="email" autoComplete="email" required value={form.email} inputMode="email" type="email" onChange={(e) => set("email", e.target.value)} aria-describedby={error ? errorId : undefined} className={inputCls} />
                  </label>
                  <label className="block" htmlFor={id("cidade")}>
                    <span className="mb-1 block text-xs text-muted">Cidade / Estado</span>
                    <input id={id("cidade")} name="cidade_estado" autoComplete="address-level2" value={form.cidade_estado} onChange={(e) => set("cidade_estado", e.target.value)} className={inputCls} />
                  </label>
                  <label className="block sm:col-span-2" htmlFor={id("tipo")}>
                    <span className="mb-1 block text-xs text-muted">Tipo de projeto</span>
                    <select id={id("tipo")} name="tipo_projeto" value={form.tipo_projeto} onChange={(e) => set("tipo_projeto", e.target.value)} className={inputCls}>
                      {TIPOS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block sm:col-span-2" htmlFor={id("mensagem")}>
                    <span className="mb-1 block text-xs text-muted">Conte sobre o que você precisa</span>
                    <textarea
                      id={id("mensagem")}
                      name="mensagem"
                      value={form.mensagem ?? ""}
                      onChange={(e) => set("mensagem", e.target.value)}
                      className={`${inputCls} h-24 resize-none`}
                    />
                  </label>
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-champagne/10 bg-surfaceSoft/40 p-3 text-sm text-muted" htmlFor={id("aceite")}>
                  <input
                    id={id("aceite")}
                    name="aceite"
                    type="checkbox"
                    checked={form.aceite}
                    onChange={(e) => set("aceite", e.target.checked)}
                    aria-describedby={error ? errorId : undefined}
                    className="mt-1 accent-champagne"
                  />
                  <span>Aceito ser contatado pela equipe para receber uma proposta personalizada.</span>
                </label>

                {error && (
                  <p id={errorId} role="alert" className="mt-3 text-sm text-amber-300">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button type="button" className="btn-secondary" onClick={closeProposal} disabled={submitting}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Enviando..." : "Enviar solicitação"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
