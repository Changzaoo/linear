import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Scroll suavizado (inércia) para deixar as cenas 3D controladas por
 * scroll ainda mais cinematográficas. O Lenis move o scroll nativo da
 * janela, então o useScroll do Framer Motion e o header continuam
 * funcionando sem nenhuma mudança.
 *
 * - `anchors`: intercepta os links #ancora do menu e rola suavemente.
 * - Respeita `prefers-reduced-motion` (desativa a inércia).
 * - No touch o scroll permanece nativo (comportamento padrão do Lenis),
 *   evitando conflito com gestos no mobile.
 */
export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      anchors: { offset: -80 }, // compensa o header fixo (h-20)
    });

    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
}
