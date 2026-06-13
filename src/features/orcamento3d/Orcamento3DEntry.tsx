import { useEffect, useState } from "react";
import { AnimatePresence, motion, MotionValue, useMotionValueEvent } from "framer-motion";
import { isMobileViewport } from "../../lib/webgl";
import { openStudio } from "./useOrcamento3DStore";

/* ============================================================
   Orcamento3DEntry — chamada premium que surge quando a primeira
   cena 3D termina de montar (progresso do scroll perto do fim).
   ENTER no desktop / botão grande no mobile abrem o Estúdio 3D.
   ============================================================ */

interface Props {
  /** progresso de montagem da cena (0→1) vindo do Hero */
  progress: MotionValue<number>;
}

export default function Orcamento3DEntry({ progress }: Props) {
  const [ready, setReady] = useState(progress.get() >= 0.93);
  const mobile = isMobileViewport();

  useMotionValueEvent(progress, "change", (v) => {
    const next = v >= 0.93;
    setReady((prev) => (prev === next ? prev : next));
  });

  // ENTER abre o estúdio no desktop
  useEffect(() => {
    if (!ready || mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.repeat) {
        e.preventDefault();
        openStudio();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, mobile]);

  return (
    <AnimatePresence>
      {ready && (
        <motion.div
          key="orc3d-entry"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-x-0 bottom-[14vh] z-20 flex justify-center px-6"
        >
          <div className="pointer-events-auto relative max-w-xl overflow-hidden rounded-2xl border border-champagne/25 bg-[rgba(10,9,8,0.62)] px-8 py-7 text-center shadow-glow backdrop-blur-md">
            {/* brilho superior sutil */}
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-champagne/70 to-transparent" />

            <p className="mb-1 text-[11px] uppercase tracking-widest2 text-champagne/80">
              Estúdio 3D de Orçamento
            </p>
            <h2 className="font-display text-2xl italic leading-snug text-text md:text-[2rem]">
              Grandes projetos começam com uma visão clara.
            </h2>

            {mobile ? (
              <button
                type="button"
                onClick={openStudio}
                className="mt-6 w-full rounded-xl border border-champagne/40 bg-champagne/15 px-6 py-4 text-base font-medium tracking-wide text-text transition active:scale-[0.98]"
              >
                Iniciar Orçamento 3D
              </button>
            ) : (
              <motion.p
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                className="mt-5 text-sm text-muted"
              >
                Pressione{" "}
                <kbd className="mx-1 rounded-md border border-champagne/40 bg-surface px-2.5 py-1 font-sans text-xs font-semibold tracking-wide text-champagne">
                  ENTER
                </kbd>{" "}
                para iniciar seu orçamento 3D
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
