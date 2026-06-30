import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sendChat, getHistory, saveHistory, getConversaId, saveConversaId, clearChat as clearChatStorage } from "./chatApi";
import type { ChatMessage } from "../../shared/contract";

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "Olá! Sou o assistente da NEXUS Marcenaria. Me conta sobre seu projeto que eu te ajudo. 🙂",
};

const WELCOME_ON_EMPTY = true; // mostrar boas-vindas quando abrir com histórico vazio

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [showContactRegistered, setShowContactRegistered] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  // Load histórico e conversaId ao montar ou abrir
  useEffect(() => {
    if (open) {
      const saved = getHistory();
      const savedConversaId = getConversaId();
      setConversaId(savedConversaId);

      // Se vazio e WELCOME_ON_EMPTY, mostra boas-vindas
      if (saved.length === 0 && WELCOME_ON_EMPTY) {
        setMessages([WELCOME_MESSAGE]);
      } else {
        setMessages(saved);
      }

      setHasError(false);
      setShowContactRegistered(false);
      setRegistrationToken(null);
    }
  }, [open]);

  // Auto-scroll para o fim das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Fecha com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    const updated = [...messages, userMessage];
    setMessages(updated);
    saveHistory(updated);
    setInput("");
    setSending(true);
    setHasError(false);
    setShowContactRegistered(false);

    try {
      const response = await sendChat(updated, conversaId ?? undefined, location.pathname);

      // Guarda conversaId
      if (response.conversaId) {
        setConversaId(response.conversaId);
        saveConversaId(response.conversaId);
      }

      // Adiciona resposta do assistente
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.reply,
      };
      const finalMessages = [...updated, assistantMessage];
      setMessages(finalMessages);
      saveHistory(finalMessages);

      // Se registrou um lead
      if (response.registered) {
        setShowContactRegistered(true);
        if (response.token) {
          setRegistrationToken(response.token);
        }
      }
    } catch (error: any) {
      // Mostra erro amigável
      const errorMsg = error?.message || "Estou com instabilidade agora. Tente novamente em instantes ou use o botão Solicitar proposta.";
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: errorMsg,
      };
      const finalMessages = [...updated, errorMessage];
      setMessages(finalMessages);
      saveHistory(finalMessages);
      setHasError(true);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = () => {
    clearChatStorage();
    setMessages(WELCOME_ON_EMPTY ? [WELCOME_MESSAGE] : []);
    setConversaId(null);
    setInput("");
    setShowContactRegistered(false);
    setRegistrationToken(null);
    setHasError(false);
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  return (
    <>
      {/* Launcher (botão flutuante) */}
      <motion.button
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.08 }}
        onClick={() => setOpen(!open)}
        aria-label="Abrir chat de IA"
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-champagne/90 shadow-[0_8px_30px_rgba(216,185,120,0.3)] transition-shadow hover:shadow-[0_8px_40px_rgba(216,185,120,0.5)] focus:outline-none focus:ring-2 focus:ring-champagne/50"
      >
        {/* Ícone SVG simples de chat/balão */}
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-background" aria-hidden="true">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </motion.button>

      {/* Painel do chat */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-sm"
            />

            {/* Painel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              role="dialog"
              aria-modal="true"
              aria-label="Chat com assistente de IA"
              className="fixed bottom-6 right-6 z-[130] flex flex-col rounded-2xl border border-champagne/20 bg-surface shadow-card"
              style={{
                width: "min(380px, calc(100vw - 2rem))",
                height: "min(560px, calc(100vh - 2rem))",
              }}
            >
              {/* Cabeçalho */}
              <div className="flex items-start justify-between border-b border-champagne/10 p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar simples */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-champagne/20 text-lg">
                    ✨
                  </div>
                  <div>
                    <p className="font-medium text-text">Assistente NEXUS</p>
                    <p className="text-xs text-muted">Online · responde na hora</p>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-1">
                  <button
                    onClick={handleClearChat}
                    aria-label="Limpar conversa"
                    className="rounded-lg p-2 text-muted transition hover:bg-surfaceSoft hover:text-text"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-currentColor" aria-hidden="true">
                      <path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Fechar chat"
                    className="rounded-lg p-2 text-muted transition hover:bg-surfaceSoft hover:text-text"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-currentColor" aria-hidden="true">
                      <path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Área de mensagens */}
              <div className="flex-1 overflow-y-auto space-y-3 p-4">
                {messages.map((msg, idx) => (
                  <div
                    key={`${uid}-msg-${idx}`}
                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Bolha de mensagem */}
                    <div
                      className={`max-w-xs rounded-lg px-3 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-champagne/90 text-background"
                          : "bg-surfaceSoft text-text"
                      }`}
                      style={{
                        wordWrap: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.role === "user" ? (
                        <span dangerouslySetInnerHTML={{ __html: escapeHtml(msg.content) }} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {/* Indicador "digitando" */}
                {sending && (
                  <div className="flex gap-2">
                    <div className="flex gap-1 rounded-lg bg-surfaceSoft px-3 py-2.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-muted/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="inline-block h-2 w-2 rounded-full bg-muted/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="inline-block h-2 w-2 rounded-full bg-muted/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {/* Nota de contato registrado */}
                {showContactRegistered && (
                  <div className="rounded-lg border border-champagne/30 bg-champagne/10 px-3 py-2 text-xs text-text">
                    ✓ Contato registrado — nossa equipe vai falar com você.
                  </div>
                )}

                {/* Ref para scroll */}
                <div ref={messagesEndRef} />
              </div>

              {/* Botão "Enviar plantas" (se registrado) */}
              {showContactRegistered && registrationToken && (
                <div className="border-t border-champagne/10 px-4 py-3">
                  <button
                    onClick={() => {
                      window.location.hash = `#/area-cliente?codigo=${registrationToken}`;
                    }}
                    className="btn-primary w-full"
                  >
                    Enviar plantas e arquivos
                  </button>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="border-t border-champagne/10 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={sending}
                    placeholder="Escreva sua mensagem..."
                    aria-label="Digite uma mensagem"
                    className="flex-1 rounded-lg border border-champagne/20 bg-background/60 px-3 py-2 text-sm text-text placeholder-muted/50 outline-none transition disabled:opacity-50 focus:border-champagne/50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    aria-label="Enviar mensagem"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-champagne/80 text-background transition hover:bg-champagne disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-currentColor" aria-hidden="true">
                      <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 C22.9702544,11.6889879 22.9702544,11.5318905 22.9702544,11.4747931 L4.13399899,2.81047506 C3.34915502,2.39683393 2.40734225,2.50604706 1.77946707,3.13466989 C0.994623095,3.92015607 0.837654326,5.01151496 1.15159189,5.80700114 L3.03521743,12.2479941 C3.03521743,12.4050915 3.34915502,12.5121805 3.50612381,12.5121805 L16.6915026,13.2976674 C16.6915026,13.2976674 17.1624089,13.2976674 17.1624089,12.8264753 L17.1624089,12.0409883 C17.1624089,11.6889879 17.1624089,11.4744748 16.6915026,11.4744748 Z" />
                    </svg>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
