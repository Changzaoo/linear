let cached: boolean | null = null;

/** Detecta suporte a WebGL para exibir fallback elegante quando indisponível. */
export function supportsWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    cached = !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    cached = false;
  }
  return cached;
}

/** True em telas pequenas — usado para simplificar as cenas 3D no mobile. */
export function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 768;
}
