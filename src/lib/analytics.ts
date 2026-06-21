/* ============================================================
   Analytics leve e privacy-first.

   - No-op por padrão: nada é enviado sem um provider configurado.
   - Suporta Plausible quando `window.plausible` está presente
     (script carregado via index.html ativado por env).
   - Ative definindo VITE_ANALYTICS_DOMAIN no .env (o mesmo domínio
     usado no data-domain do script do Plausible em index.html).

   Não carrega nenhum terceiro automaticamente. Não usa cookies.
   ============================================================ */

type PlausibleFn = (
  event: string,
  options?: { props?: Record<string, unknown>; callback?: () => void },
) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

/** Domínio configurado para analytics. Vazio = analytics desativado. */
export const ANALYTICS_DOMAIN = import.meta.env.VITE_ANALYTICS_DOMAIN?.trim() || "";

/** True quando há um provider de analytics configurado. */
export const analyticsEnabled = (): boolean => ANALYTICS_DOMAIN.length > 0;

/**
 * Registra um evento de conversão. No-op silencioso quando não há
 * provider configurado ou disponível na página.
 *
 * @example track("proposal_open")
 * @example track("proposal_submit", { tipo_projeto: "Loja / varejo" })
 */
export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!analyticsEnabled()) return;

  const plausible = window.plausible;
  if (typeof plausible === "function") {
    plausible(event, props ? { props } : undefined);
  }
}
