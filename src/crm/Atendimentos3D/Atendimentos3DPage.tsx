import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  listAttendances,
  onCrmEvent,
  initCrmSync,
} from "../../features/orcamento3d/crmBridge";
import type { Attendance, ProjectStatus } from "../../features/orcamento3d/types";
import Atendimento3DCard from "./Atendimento3DCard";
import Atendimento3DDetails from "./Atendimento3DDetails";
import ArchitectStatus from "./ArchitectStatus";
import NetStatus from "../../features/orcamento3d/NetStatus";
import { STATUS_META } from "./statusMeta";

const FILTERS: { value: ProjectStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "novo-lead-3d", label: "Novos" },
  { value: "aguardando-arquiteto", label: "Aguardando" },
  { value: "em-atendimento", label: "Em atendimento" },
  { value: "projeto-3d-enviado-analise", label: "Análise" },
  { value: "orcamento-solicitado", label: "Orçamento" },
  { value: "em-negociacao", label: "Negociação" },
  { value: "fechado", label: "Fechados" },
  { value: "arquivado", label: "Arquivados" },
];

/** Som curto de notificação (beep sintetizado, sem asset). */
function playPing() {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch {
    /* navegador bloqueou áudio */
  }
}

export default function Atendimentos3DPage() {
  const [list, setList] = useState<Attendance[]>([]);
  const [filter, setFilter] = useState<ProjectStatus | "todos">("todos");
  const [openId, setOpenId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    initCrmSync();
    setList(listAttendances());
    firstLoad.current = false;
    return onCrmEvent((e) => {
      if (e.type === "attendance-created" || e.type === "attendance-updated" || e.type === "sync") {
        setList(listAttendances());
      }
      if (e.type === "notify-architects") {
        setBanner("Novo cliente solicitando ajuda no Orçamento 3D.");
        playPing();
        setList(listAttendances());
        setTimeout(() => setBanner(null), 6000);
      }
    });
  }, []);

  const filtered = useMemo(
    () => (filter === "todos" ? list : list.filter((a) => a.status === filter)),
    [list, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    list.forEach((a) => (c[a.status] = (c[a.status] ?? 0) + 1));
    return c;
  }, [list]);

  return (
    <div className="min-h-screen bg-background text-text">
      {/* notificação */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl border border-champagne/40 bg-[rgba(20,16,12,0.95)] px-5 py-3 text-sm text-champagne shadow-glow"
          >
            🔔 {banner}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="border-b border-champagne/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest2 text-champagne/80">LINEAR · CRM</p>
            <h1 className="font-display text-2xl text-text">Suporte 3D / Arquiteto</h1>
          </div>
          <div className="flex items-center gap-4">
            <NetStatus />
            <a href="#/" className="text-sm text-muted hover:text-text">← Voltar ao site</a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-6 py-6 lg:grid-cols-[1fr_280px]">
        <section>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  filter === f.value ? "bg-champagne/20 text-text" : "text-muted hover:text-text"
                }`}
              >
                {f.label}
                {f.value !== "todos" && counts[f.value] ? ` (${counts[f.value]})` : ""}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-champagne/15 p-10 text-center text-sm text-muted">
                Nenhum atendimento {filter !== "todos" ? `em "${STATUS_META[filter as ProjectStatus].label}"` : "ainda"}.
                <br />Os leads do Estúdio 3D aparecem aqui automaticamente.
              </div>
            )}
            {filtered.map((a) => (
              <Atendimento3DCard key={a.id} att={a} onOpen={() => setOpenId(a.id)} />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <ArchitectStatus />
          <div className="rounded-xl border border-champagne/15 bg-surface/60 p-4 text-xs text-muted">
            <p className="mb-1 font-semibold text-text">Como funciona</p>
            Quando um cliente solicita arquiteto no Estúdio 3D, o atendimento entra aqui em tempo real.
            Abra outra aba no Estúdio para ver a sincronização de lead, ambiente, andares e móveis.
          </div>
        </aside>
      </main>

      {/* detalhe */}
      <AnimatePresence>
        {openId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex justify-end bg-background/70 backdrop-blur-sm"
            onClick={() => setOpenId(null)}
          >
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-full max-w-md border-l border-champagne/15 bg-surface"
            >
              <Atendimento3DDetails id={openId} onClose={() => setOpenId(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
