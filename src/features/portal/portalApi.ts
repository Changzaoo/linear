/* ============================================================
   Portal do Cliente — camada de acesso ao CRM.

   O acesso é por "código de acompanhamento" (token do lead), sem senha.
   O token fica guardado no localStorage para o cliente reentrar sozinho.
   Endpoints/tipos vêm do contrato compartilhado (src/shared/contract.ts).
   ============================================================ */
import {
  CRM_ENDPOINTS,
  crmFetch,
  crmUpload,
  crmFileUrl,
  type PortalState,
  type PortalArquivo,
} from "../../shared/contract";

const TOKEN_KEY = "nexus:portal:token";

export type UploadResult = {
  ok: boolean;
  arquivos: PortalArquivo[];
  rejeitados: string[];
};

/* ---------- persistência local do código ---------- */
export function getStoredToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
export function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* quota */
  }
}
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

/* ---------- chamadas à API pública do CRM ---------- */

/** Valida o código e retorna o lead + arquivos já enviados (404 se inválido). */
export function abrirPortal(token: string): Promise<PortalState> {
  return crmFetch<PortalState>(CRM_ENDPOINTS.portal(token.trim()));
}

/** Envia 1+ arquivos de uma categoria. multipart/form-data. */
export function enviarArquivos(token: string, categoria: string, files: File[]): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("categoria", categoria);
  files.forEach((f) => fd.append("arquivos", f));
  return crmUpload<UploadResult>(CRM_ENDPOINTS.portalArquivos(token.trim()), fd);
}

/** Remove um arquivo enviado. */
export function removerArquivo(token: string, arquivoId: string): Promise<{ ok: boolean }> {
  return crmFetch<{ ok: boolean }>(CRM_ENDPOINTS.portalArquivo(token.trim(), arquivoId), {
    method: "DELETE",
  });
}

export { crmFileUrl };

/* ---------- helpers de UI ---------- */

/** Formata bytes em algo legível ("12 KB", "3,4 MB"). */
export function formatarBytes(n: number): string {
  if (!n || n < 1024) return `${n || 0} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1).replace(".", ",")} MB`;
}

/** Lê o código do hash (#/area-cliente?codigo=XYZ ou #/area-cliente/XYZ). */
export function tokenFromHash(): string {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash || "";
  const q = hash.indexOf("?");
  if (q >= 0) {
    const params = new URLSearchParams(hash.slice(q + 1));
    const code = params.get("codigo") || params.get("code") || params.get("token");
    if (code) return code.trim();
  }
  const m = /#\/?area-cliente\/([A-Za-z0-9]+)/.exec(hash);
  return m ? m[1].trim() : "";
}
