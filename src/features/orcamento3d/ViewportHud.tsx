import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOrc3d } from "./useOrcamento3DStore";

/* HUD sobre o canvas:
   - mira em pontinho na 1ª e 3ª pessoa (referência de centro/visão);
   - aviso explicando por que o cursor do mouse sumiu (pointer lock) na
     1ª pessoa, com a dica de pressionar ESC para liberá-lo. */
export default function ViewportHud({ mobile }: { mobile: boolean }) {
  const viewMode = useOrc3d((s) => s.viewMode);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const sync = () => setLocked(!!document.pointerLockElement);
    sync();
    document.addEventListener("pointerlockchange", sync);
    return () => document.removeEventListener("pointerlockchange", sync);
  }, []);

  const showCrosshair = viewMode === "primeira" || viewMode === "terceira";
  const firstPerson = viewMode === "primeira" && !mobile;

  return (
    <>
      {/* mira central */}
      {showCrosshair && (
        <div className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <span className="absolute h-5 w-5 rounded-full border border-white/25" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_4px_rgba(0,0,0,0.9)] ring-1 ring-black/50" />
          </div>
        </div>
      )}

      {/* aviso do cursor (pointer lock) — 1ª pessoa no desktop */}
      {firstPerson && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-[15] flex justify-center px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={locked ? "locked" : "unlocked"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs backdrop-blur-md ${
                locked
                  ? "border-champagne/40 bg-[rgba(12,10,8,0.82)] text-champagne"
                  : "border-white/15 bg-[rgba(12,10,8,0.7)] text-muted"
              }`}
            >
              {locked ? (
                <>
                  <span aria-hidden>🔒</span>
                  <span>
                    Cursor oculto para você olhar ao redor. Pressione <b className="text-text">ESC</b> para liberar o mouse.
                  </span>
                </>
              ) : (
                <>
                  <span aria-hidden>🖱️</span>
                  <span>Clique na cena para olhar ao redor (o cursor fica oculto enquanto você navega).</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
