/* ============================================================
   Portal do Cliente — área reservada onde o cliente envia os arquivos
   técnicos do projeto (planta baixa, layout, cortes, vistas/elevações,
   forro, elétrica/hidráulica, detalhamento de marcenaria, modelos 3D,
   renders/fotos e memorial). Tudo cai no CRM, vinculado ao lead.

   Acesso por "código de acompanhamento" (token), sem senha. O código é
   guardado no navegador para o cliente reentrar sozinho.
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ARQUIVO_CATEGORIAS,
  ARQUIVO_EXTENSOES_ACEITAS,
  ARQUIVO_MAX_BYTES,
  type PortalArquivo,
  type PortalState,
} from "../../shared/contract";
import {
  abrirPortal,
  enviarArquivos,
  removerArquivo,
  getStoredToken,
  storeToken,
  clearToken,
  tokenFromHash,
  crmFileUrl,
  formatarBytes,
} from "./portalApi";

const ACCEPT = ARQUIVO_EXTENSOES_ACEITAS.join(",");
const MAX_MB = Math.round(ARQUIVO_MAX_BYTES / (1024 * 1024));

type Msg = { tone: "ok" | "err" | "info"; text: string } | null;

export default function ClientPortal() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<PortalState | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [categoria, setCategoria] = useState<string>(ARQUIVO_CATEGORIAS[0].key);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ---------- carga inicial: tenta o código do link ou do navegador ---------- */
  const carregar = useCallback(async (tk: string) => {
    setLoading(true);
    setCodeError("");
    try {
      const s = await abrirPortal(tk);
      setState(s);
      setToken(tk);
      storeToken(tk);
      return true;
    } catch (e: any) {
      setState(null);
      setToken("");
      if (e?.status === 404) setCodeError("Código não encontrado. Confira e tente de novo.");
      else setCodeError(e?.message || "Não foi possível abrir sua área agora.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const tk = tokenFromHash() || getStoredToken();
    if (tk) carregar(tk);
    else setLoading(false);
  }, [carregar]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setState(await abrirPortal(token));
    } catch {
      /* mantém o estado atual */
    }
  }, [token]);

  /* ---------- envio de arquivos ---------- */
  const doUpload = useCallback(
    async (files: File[]) => {
      if (!token || !files.length) return;
      const grandes = files.filter((f) => f.size > ARQUIVO_MAX_BYTES);
      const validos = files.filter((f) => f.size <= ARQUIVO_MAX_BYTES);
      if (!validos.length) {
        setMsg({ tone: "err", text: `Arquivo grande demais (limite de ${MAX_MB} MB por arquivo).` });
        return;
      }
      setUploading(true);
      setMsg({ tone: "info", text: `Enviando ${validos.length} arquivo(s)...` });
      try {
        const res = await enviarArquivos(token, categoria, validos);
        setState((s) => (s ? { ...s, arquivos: [...res.arquivos, ...s.arquivos] } : s));
        const partes: string[] = [`${res.arquivos.length} enviado(s).`];
        if (res.rejeitados?.length) partes.push(`Recusados: ${res.rejeitados.join(", ")}.`);
        if (grandes.length) partes.push(`${grandes.length} acima de ${MAX_MB} MB ignorado(s).`);
        setMsg({ tone: res.rejeitados?.length || grandes.length ? "info" : "ok", text: partes.join(" ") });
      } catch (e: any) {
        setMsg({ tone: "err", text: e?.message || "Falha ao enviar. Tente novamente." });
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [token, categoria]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) doUpload(files);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) doUpload(files);
  };

  const apagar = async (a: PortalArquivo) => {
    if (!token) return;
    if (!window.confirm(`Remover "${a.nome}"?`)) return;
    setState((s) => (s ? { ...s, arquivos: s.arquivos.filter((x) => x.id !== a.id) } : s));
    try {
      await removerArquivo(token, a.id);
    } catch {
      setMsg({ tone: "err", text: "Não foi possível remover. Recarregando lista." });
      refresh();
    }
  };

  const sair = () => {
    clearToken();
    setToken("");
    setState(null);
    setCodeInput("");
  };

  const fecharPortal = () => {
    window.location.hash = "#inicio";
  };

  const grupos = useMemo(() => {
    const arq = state?.arquivos || [];
    return ARQUIVO_CATEGORIAS.map((c) => ({
      ...c,
      itens: arq.filter((a) => a.categoria === c.key),
    })).filter((g) => g.itens.length > 0);
  }, [state]);

  const total = state?.arquivos.length || 0;
  const linkCompartilhavel =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}#/area-cliente?codigo=${token}`
      : "";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-background text-text">
      {/* topo */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-background/85 backdrop-blur-md">
        <div className="container-site flex h-16 items-center justify-between">
          <button onClick={fecharPortal} className="flex items-baseline gap-2" aria-label="Voltar ao site">
            <span className="font-display text-xl tracking-wide text-text">NEXUS</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-widest2 text-champagne sm:inline">
              Área do Cliente
            </span>
          </button>
          <button onClick={fecharPortal} className="btn-secondary !px-4 !py-2 text-xs">
            Voltar ao site
          </button>
        </div>
      </header>

      <main className="container-site py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="animate-pulse font-display text-lg italic text-champagne">Abrindo sua área…</p>
          </div>
        ) : !state ? (
          <CodeEntry
            codeInput={codeInput}
            setCodeInput={setCodeInput}
            codeError={codeError}
            onSubmit={() => carregar(codeInput)}
          />
        ) : (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* cabeçalho do projeto */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium"
            >
              <p className="text-[11px] uppercase tracking-widest2 text-champagne/80">Seu projeto</p>
              <h1 className="mt-1 font-display text-2xl italic text-text">
                Olá, {state.lead.nome.split(" ")[0] || "cliente"}.
              </h1>
              <p className="mt-2 text-sm text-muted">
                Envie aqui as plantas, projetos e modelos 3D do seu ambiente. Nossa equipe de projetistas
                e marcenaria recebe tudo automaticamente para analisar e executar.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
                {state.lead.tipoProjeto && (
                  <span>
                    Tipo: <span className="text-text">{state.lead.tipoProjeto}</span>
                  </span>
                )}
                {state.lead.status && (
                  <span>
                    Status: <span className="text-champagne">{state.lead.status}</span>
                  </span>
                )}
              </div>

              <div className="mt-4 rounded-lg border border-champagne/15 bg-surfaceSoft/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">Seu código de acompanhamento</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="select-all rounded bg-background/60 px-2 py-1 text-sm text-champagne">
                    {token}
                  </code>
                  <button
                    onClick={() => navigator.clipboard?.writeText(token)}
                    className="btn-secondary !px-3 !py-1.5 text-[11px]"
                  >
                    Copiar código
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(linkCompartilhavel)}
                    className="btn-secondary !px-3 !py-1.5 text-[11px]"
                  >
                    Copiar link de acesso
                  </button>
                  <button onClick={sair} className="ml-auto text-[11px] text-muted underline hover:text-text">
                    Sair desta área
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Guarde este código para voltar e enviar novos arquivos quando quiser.
                </p>
              </div>
            </motion.section>

            {/* envio */}
            <section className="card-premium">
              <h2 className="font-display text-lg text-text">Enviar arquivos</h2>
              <p className="mt-1 text-sm text-muted">Escolha o tipo de documento e arraste os arquivos.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {ARQUIVO_CATEGORIAS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategoria(c.key)}
                    title={c.hint}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      categoria === c.key
                        ? "border-champagne/60 bg-champagne/15 text-text"
                        : "border-champagne/20 text-muted hover:border-champagne/40 hover:text-text"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-[11px] text-muted">
                {ARQUIVO_CATEGORIAS.find((c) => c.key === categoria)?.hint}
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
                }}
                className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                  dragging ? "border-champagne bg-champagne/10" : "border-champagne/25 hover:border-champagne/50"
                }`}
              >
                <span className="text-3xl">⬆</span>
                <p className="mt-2 text-sm text-text">
                  {uploading ? "Enviando…" : "Arraste arquivos aqui ou clique para selecionar"}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  PDF, DWG/DXF, SKP, GLB/OBJ/FBX/STL, Revit/IFC, imagens, planilhas — até {MAX_MB} MB cada
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  onChange={onPick}
                  className="hidden"
                />
              </div>

              <AnimatePresence>
                {msg && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-3 text-sm ${
                      msg.tone === "err"
                        ? "text-amber-300"
                        : msg.tone === "ok"
                        ? "text-emerald-300"
                        : "text-muted"
                    }`}
                  >
                    {msg.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </section>

            {/* lista de enviados */}
            <section className="card-premium">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-text">Arquivos enviados ({total})</h2>
                <button onClick={refresh} className="text-xs text-muted underline hover:text-text">
                  Atualizar
                </button>
              </div>

              {total === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Você ainda não enviou nenhum arquivo. Use o campo acima para começar.
                </p>
              ) : (
                <div className="mt-4 space-y-5">
                  {grupos.map((g) => (
                    <div key={g.key}>
                      <p className="text-[11px] uppercase tracking-wide text-champagne/80">{g.label}</p>
                      <ul className="mt-2 divide-y divide-white/5 overflow-hidden rounded-lg border border-white/5">
                        {g.itens.map((a) => (
                          <li key={a.id} className="flex items-center gap-3 bg-surfaceSoft/30 px-3 py-2.5">
                            <span className="text-lg">📄</span>
                            <div className="min-w-0 flex-1">
                              <a
                                href={crmFileUrl(token, a.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="block truncate text-sm text-text hover:text-champagne"
                                title={a.nome}
                              >
                                {a.nome}
                              </a>
                              <span className="text-[11px] text-muted">{formatarBytes(a.tamanho)}</span>
                            </div>
                            <a
                              href={crmFileUrl(token, a.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-muted underline hover:text-text"
                            >
                              abrir
                            </a>
                            <button
                              onClick={() => apagar(a)}
                              className="text-[11px] text-red-300/80 underline hover:text-red-300"
                            >
                              remover
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------- tela de acesso por código ---------- */
function CodeEntry({
  codeInput,
  setCodeInput,
  codeError,
  onSubmit,
}: {
  codeInput: string;
  setCodeInput: (v: string) => void;
  codeError: string;
  onSubmit: () => void;
}) {
  return (
    <div className="mx-auto max-w-md py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-premium">
        <p className="text-[11px] uppercase tracking-widest2 text-champagne/80">Área do Cliente</p>
        <h1 className="mt-1 font-display text-2xl italic text-text">Acompanhe e envie seus arquivos.</h1>
        <p className="mt-2 text-sm text-muted">
          Informe o código de acompanhamento que você recebeu ao solicitar a proposta ou montar seu
          projeto no Estúdio 3D.
        </p>
        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (codeInput.trim()) onSubmit();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Código de acompanhamento</span>
            <input
              autoFocus
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="ex.: 44308e44540b4157a9124643bce7a520"
              className="w-full rounded-lg border border-champagne/20 bg-background/60 px-3 py-2.5 text-sm text-text outline-none transition focus:border-champagne/50"
            />
          </label>
          {codeError && <p className="mt-2 text-sm text-amber-300">{codeError}</p>}
          <button type="submit" className="btn-primary mt-4 w-full" disabled={!codeInput.trim()}>
            Entrar
          </button>
        </form>
        <p className="mt-4 text-[11px] text-muted">
          Ainda não tem um código? Solicite uma proposta no site — ele é gerado automaticamente.
        </p>
      </motion.div>
    </div>
  );
}
