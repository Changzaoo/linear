import { useEffect } from "react";
import {
  openCollaboration,
  setActiveSession,
  myPeerId,
  type CollabSession,
} from "./collaboration";
import { actions, isApplyingRemote, orc3dStore, useOrc3d } from "./useOrcamento3DStore";
import { prunePeers, removePeer, upsertPeer, presenceStore } from "./presence";
import { handleVoiceSignal, stopVoice } from "./voice";

/* Orquestra a colaboração em tempo real: doc-sync (eco-seguro),
   presença com heartbeat, chat e sinalização de voz. Sem UI. */
export default function CollabBridge() {
  const projectId = useOrc3d((s) => s.projectId);

  useEffect(() => {
    const session: CollabSession = openCollaboration(projectId);
    setActiveSession(session);

    let lastSyncedJson = JSON.stringify(orc3dStore.getState().doc);
    let publishTimer: ReturnType<typeof setTimeout> | null = null;

    // publica alterações locais do doc (debounce, sem eco)
    const unsub = orc3dStore.subscribe(() => {
      if (isApplyingRemote()) return;
      if (publishTimer) clearTimeout(publishTimer);
      publishTimer = setTimeout(() => {
        const doc = orc3dStore.getState().doc;
        const json = JSON.stringify(doc);
        if (json === lastSyncedJson) return;
        lastSyncedJson = json;
        session.publishDoc(doc);
      }, 180);
    });

    // recebe mensagens do colaborador
    const off = session.onMessage((m) => {
      switch (m.type) {
        case "doc": {
          if (m.from === myPeerId) return;
          lastSyncedJson = JSON.stringify(m.doc);
          actions.applyRemoteDoc(m.doc as any);
          break;
        }
        case "chat": {
          const cur = orc3dStore.getState().chat;
          if (!cur.some((c) => c.id === m.message.id)) actions.addChat(m.message);
          break;
        }
        case "presence": {
          if (m.presence.id !== myPeerId) {
            const known = presenceStore.getState().peers[m.presence.id];
            upsertPeer(m.presence);
            // semeia o recém-chegado com o doc autoritativo (cliente manda)
            if (!known && orc3dStore.getState().role === "cliente") session.publishDoc(orc3dStore.getState().doc);
          }
          break;
        }
        case "leave":
          removePeer(m.id);
          break;
        default:
          if (m.type.startsWith("voice-")) handleVoiceSignal(m);
      }
    });

    // heartbeat de presença + limpeza de presenças paradas
    const beat = setInterval(() => {
      const s = orc3dStore.getState();
      session.publishPresence({
        id: myPeerId,
        role: s.role,
        name: s.role === "arquiteto" ? "Arquiteto" : s.doc.client.name || "Cliente",
        at: Date.now(),
      });
      prunePeers();
    }, 2500);

    return () => {
      clearInterval(beat);
      if (publishTimer) clearTimeout(publishTimer);
      unsub();
      off();
      stopVoice();
      session.close();
      setActiveSession(null);
      presenceStore.setState({ peers: {} });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return null;
}
