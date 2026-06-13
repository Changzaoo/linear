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
          <div className="pointer-events-auto px-2 py-1 text-center">
            {mobile ? (
              <motion.p className="mt-2 text-sm text-muted">
                Pressione{" "}
                <kbd className="mx-1 rounded-md border border-champagne/40 bg-surface px-2.5 py-1 font-sans text-xs font-semibold tracking-wide text-champagne">
                  ENTER
                </kbd>{" "}
                para iniciar seu orçamento 3D
              </motion.p>
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
