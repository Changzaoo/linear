import {
  CRM_API_BASE,
  CRM_ENDPOINTS,
  ChatMessage,
  ChatResponse,
  type CrmError,
} from "../../shared/contract";

/**
 * Envia mensagens para o assistente de IA.
 * Apenas o histórico dos últimos 12 mensagens é enviado (contexto).
 * A conversaId é persistida no localStorage para continuar a mesma conversa.
 */
export async function sendChat(
  messages: ChatMessage[],
  conversaId?: string,
  origem?: string
): Promise<ChatResponse> {
  const url = `${CRM_API_BASE}${CRM_ENDPOINTS.chat}`;

  const body = {
    messages: messages.slice(-12), // últimos 12 para contexto
    conversaId,
    origem,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // Parse seguro: se não OK, lança Error com msg do corpo
  if (!res.ok) {
    const errorData =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const errorMessage =
      (typeof errorData.error === "string" && errorData.error) ||
      (typeof errorData.erro === "string" && errorData.erro) ||
      `Erro ao enviar mensagem (${res.status})`;

    const err = new Error(errorMessage) as CrmError;
    err.status = res.status;
    err.data = errorData;
    throw err;
  }

  return data as ChatResponse;
}

/**
 * Obtém o histórico de mensagens do localStorage.
 * Chave: "nexus:chat:v1"
 */
export function getHistory(): ChatMessage[] {
  try {
    const stored = localStorage.getItem("nexus:chat:v1");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChatMessage[];
  } catch {
    return [];
  }
}

/**
 * Salva o histórico no localStorage, mantendo apenas os últimos 50.
 * Chave: "nexus:chat:v1"
 */
export function saveHistory(messages: ChatMessage[]): void {
  const toSave = messages.slice(-50);
  localStorage.setItem("nexus:chat:v1", JSON.stringify(toSave));
}

/**
 * Obtém o ID da conversa atual (para continuar a mesma).
 * Chave: "nexus:chat:conversa"
 */
export function getConversaId(): string | null {
  try {
    return localStorage.getItem("nexus:chat:conversa");
  } catch {
    return null;
  }
}

/**
 * Salva o ID da conversa.
 * Chave: "nexus:chat:conversa"
 */
export function saveConversaId(id: string): void {
  localStorage.setItem("nexus:chat:conversa", id);
}

/**
 * Limpa todo o histórico do chat e o ID da conversa.
 */
export function clearChat(): void {
  localStorage.removeItem("nexus:chat:v1");
  localStorage.removeItem("nexus:chat:conversa");
}
