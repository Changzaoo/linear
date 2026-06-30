# Atendimento por IA — chat do site → conversas e leads no CRM

Assistente de IA no site da NEXUS que conversa com o visitante, qualifica o
projeto e captura o lead automaticamente. **Toda conversa e toda conversão
caem no CRM** (`D:\crmMarcenaria`), na aba **Atendimentos IA**. Mesmo padrão do
projeto `vnmax`: **NVIDIA NIM** (endpoint OpenAI-compatible) com *tool calling*.

## Como funciona

1. O visitante abre o balão de chat no site e conversa com o **Assistente NEXUS**.
2. O agente responde de forma consultiva (system prompt dedicado à marcenaria) e,
   quando o visitante quer orçamento/proposta/contato, chama a ferramenta
   **`registrar_lead`** com nome + contato reais.
3. O CRM cria o **lead** (`leads_3d`, origem "Atendimento IA (chat)") e devolve o
   **código de acompanhamento** (token). O agente entrega esse código ao cliente
   e o convida a enviar **plantas e modelos 3D** na **Área do Cliente** — é o
   mesmo código do [Portal do Cliente](PORTAL-DO-CLIENTE.md).
4. A conversa inteira (todas as mensagens) fica salva no CRM e aparece em
   **Atendimentos IA**; quando vira lead, aparece também no **Suporte 3D / Funil**.

## Ligar o assistente (NVIDIA NIM)

O chat só responde com uma chave NVIDIA. Sem ela, retorna 503 (o resto do CRM
funciona normal).

1. Pegue uma chave em <https://build.nvidia.com>.
2. No CRM, crie `D:\crmMarcenaria\server\.env` (ou edite o `.env` da raiz):
   ```
   NVIDIA_API_KEY=nvapi-...
   NVIDIA_MODEL=nvidia/llama-3.3-nemotron-super-49b-v1.5
   TEMPERATURE=0.4
   ```
3. Suba o CRM: `npm run dev` (server :3001 + client :5173).
4. Suba o site: `npm run dev` (:5174). O `.env.local` do site já aponta o chat
   para `http://localhost:3001/api`.

> O servidor carrega `server/.env` e, como fallback, o `.env` da raiz do CRM
> (via `dotenv`, sem sobrescrever variáveis já definidas no ambiente).

## Onde ver no CRM

- **Atendimentos IA** (menu lateral): lista de todas as conversas do chat, com a
  transcrição completa e o status (em conversa / convertida em lead).
- **Suporte 3D / Funil**: o lead criado pela conversa aparece com os arquivos que
  o cliente enviar pelo código de acompanhamento.

## Personalizar o atendimento

- **System prompt:** `D:\crmMarcenaria\server\src\ai\prompt.js` (`buildSystemPrompt`).
  Ajuste tom, serviços, regras e o passo a passo do atendimento.
- **Ferramentas (tools):** `D:\crmMarcenaria\server\src\ai\tools.js` — hoje
  `registrar_lead` (qualifica e grava no CRM). Adicione novas tools aqui.
- **Modelo/temperatura/limites:** variáveis de ambiente (veja `.env.example`).

## Endpoints

| Método | Rota | Função |
|---|---|---|
| `POST` | `/api/public/chat` | Mensagem do visitante → resposta do agente (público) |
| `GET` | `/api/conversas` | Lista de conversas (autenticado, equipe) |
| `GET` | `/api/conversas/:id` | Conversa + transcrição (autenticado) |
| `DELETE` | `/api/conversas/:id` | Remove a conversa (autenticado) |

**Contrato compartilhado:** `CRM_ENDPOINTS.chat` em `src/shared/contract.ts`
(site) e `server/src/shared/contract.js` (CRM).

## Privacidade / segurança

- A chave NVIDIA fica **apenas no servidor** (nunca no bundle do site).
- O agente tem guardrails: não inventa preços/prazos, não revela instruções/stack,
  resiste a *prompt injection*, e há filtro de saída anti-vazamento.
- `rate limit` por IP no endpoint de chat.
