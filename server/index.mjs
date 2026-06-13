/* ============================================================
   LINEAR — relay de tempo real (colaboração 3D + CRM).
   Pub/sub por tópico com estado retido (para quem entra depois)
   e persistência em data.json. Sem framework: apenas `ws`.

   Rodar:  npm run server   (porta 8787 por padrão; PORT p/ trocar)
   O cliente conecta em ws(s)://<host>:8787 — configurável no front
   por VITE_COLLAB_WS_URL.
   ============================================================ */
import { WebSocketServer } from "ws";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 8787;
const DATA = process.env.RELAY_DATA_PATH || fileURLToPath(new URL("./data.json", import.meta.url));

/** Estado retido por tópico (ex.: "crm" guarda atendimentos/arquitetos). */
const retained = existsSync(DATA) ? safeRead() : {};
function safeRead() {
  try {
    return JSON.parse(readFileSync(DATA, "utf8"));
  } catch {
    return {};
  }
}
let saveTimer = null;
function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      mkdirSync(dirname(DATA), { recursive: true });
      writeFileSync(DATA, JSON.stringify(retained));
    } catch (e) {
      console.error("persist falhou:", e.message);
    }
  }, 250);
}

const server = createServer((req, res) => {
  if (req.url === "/" || req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, topics: Object.keys(retained).length }));
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false }));
});

const wss = new WebSocketServer({ server });
const topics = new Map(); // topic -> Set<ws>

function sub(ws, topic) {
  if (!topics.has(topic)) topics.set(topic, new Set());
  topics.get(topic).add(ws);
  ws._topics.add(topic);
}
function unsub(ws, topic) {
  topics.get(topic)?.delete(ws);
  ws._topics.delete(topic);
}
function broadcast(topic, payload, except) {
  const set = topics.get(topic);
  if (!set) return;
  const msg = JSON.stringify(payload);
  for (const c of set) if (c !== except && c.readyState === 1) c.send(msg);
}

wss.on("connection", (ws, req) => {
  ws._topics = new Set();
  ws.on("message", (buf) => {
    let m;
    try {
      m = JSON.parse(buf.toString());
    } catch {
      return;
    }
    switch (m.t) {
      case "sub":
        sub(ws, m.topic);
        if (retained[m.topic] !== undefined)
          ws.send(JSON.stringify({ t: "state", topic: m.topic, data: retained[m.topic] }));
        break;
      case "unsub":
        unsub(ws, m.topic);
        break;
      case "pub":
        broadcast(m.topic, { t: "msg", topic: m.topic, data: m.data }, ws);
        break;
      case "state:set":
        retained[m.topic] = m.data;
        persist();
        broadcast(m.topic, { t: "state", topic: m.topic, data: m.data }, ws);
        break;
      case "state:get":
        ws.send(JSON.stringify({ t: "state", topic: m.topic, data: retained[m.topic] ?? null }));
        break;
    }
  });
  ws.on("close", () => {
    for (const t of ws._topics) topics.get(t)?.delete(ws);
  });
  ws.on("error", () => {});
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`LINEAR relay no ar em ws://0.0.0.0:${PORT}`);
  console.log(`Health check em http://0.0.0.0:${PORT}/healthz`);
});
