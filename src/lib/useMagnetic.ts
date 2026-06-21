import { useEffect, useRef } from "react";

/**
 * Efeito "magnético" sutil para o CTA principal (desktop, mouse).
 *
 * O elemento é levemente atraído na direção do cursor enquanto ele paira
 * por perto, com retorno suave ao sair. Desligado em:
 *   - dispositivos de toque / ponteiro grosseiro (não há cursor preciso);
 *   - `prefers-reduced-motion: reduce` (acessibilidade).
 *
 * Usa transform via rAF (sem dependências), o que não conflita com as
 * transições de hover do CSS (estas usam translate utilitário do Tailwind;
 * aqui aplicamos translate3d diretamente no style — o efeito é cumulativo
 * e some quando o cursor sai).
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(options?: {
  /** Intensidade do deslocamento (fração da distância). Padrão 0.28. */
  strength?: number;
  /** Raio de ação além das bordas, em px. Padrão 90. */
  radius?: number;
}) {
  const ref = useRef<T>(null);
  const strength = options?.strength ?? 0.28;
  const radius = options?.radius ?? 90;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (!fine || reduced) return;

    let raf = 0;
    let curX = 0;
    let curY = 0;
    let targetX = 0;
    let targetY = 0;
    let active = false;

    const apply = () => {
      curX += (targetX - curX) * 0.18;
      curY += (targetY - curY) * 0.18;
      el.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
      if (active || Math.abs(curX) > 0.1 || Math.abs(curY) > 0.1) {
        raf = requestAnimationFrame(apply);
      } else {
        el.style.transform = "";
        raf = 0;
      }
    };

    const ensureLoop = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const within =
        e.clientX >= rect.left - radius &&
        e.clientX <= rect.right + radius &&
        e.clientY >= rect.top - radius &&
        e.clientY <= rect.bottom + radius;

      if (within) {
        active = true;
        targetX = dx * strength;
        targetY = dy * strength;
        ensureLoop();
      } else if (active) {
        active = false;
        targetX = 0;
        targetY = 0;
        ensureLoop();
      }
    };

    const onLeave = () => {
      active = false;
      targetX = 0;
      targetY = 0;
      ensureLoop();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [strength, radius]);

  return ref;
}
