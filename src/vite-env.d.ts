/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do servidor de tempo real (colaboração + CRM). Ex.: ws://192.168.0.10:8787 */
  readonly VITE_COLLAB_WS_URL?: string;
  /** Base da API do CRM LINEAR. Ex.: https://crm-marcenaria.vercel.app/api */
  readonly VITE_CRM_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
