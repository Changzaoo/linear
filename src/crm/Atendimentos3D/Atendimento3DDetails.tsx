import { useEffect, useState } from "react";
import type { Attendance, ProjectStatus } from "../../features/orcamento3d/types";
import { brl } from "../../features/orcamento3d/pricingEngine";
import { MATERIAL_MAP } from "../../features/orcamento3d/materials";
import {
  assignArchitect,
  availableArchitects,
  getAttendance,
  onCrmEvent,
  setAttendanceStatus,
} from "../../features/orcamento3d/crmBridge";
import { actions as studioActions, openStudio } from "../../features/orcamento3d/useOrcamento3DStore";
import { exportHTML } from "../../features/orcamento3d/projectExport";
import { STATUS_META } from "./statusMeta";
import { Btn } from "../../features/orcamento3d/studioUi";

const NEXT_STATUS: { status: ProjectStatus; label: string }[] = [
  { status: "em-atendimento", label: "Assumir atendimento" },
  { status: "em-negociacao", label: "Em negociação" },
  { status: "orcamento-enviado", label: "Orçamento enviado" },
  { status: "fechado", label: "Marcar fechado" },
  { status: "perdido", label: "Perdido" },
  { status: "arquivado", label: "Arquivar" },
];

const whatsappUrl = (phone: string, name: string) => {
  const clean = phone.replace(/\D/g, "");
  const msg = `Olá ${name || ""}, vi seu projeto no Estúdio 3D da LINEAR e posso te ajudar com a análise.`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
};

export default function Atendimento3DDetails({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const [att, setAtt] = useState<Attendance | undefined>(() => getAttendance(id));

  useEffect(() => {
    setAtt(getAttendance(id));
    return onCrmEvent((e) => {
      if ((e.type === "attendance-updated" || e.type === "attendance-created") && e.attendance.id === id) {
        setAtt(e.attendance);
      } else if (e.type === "sync") {
        setAtt(getAttendance(id));
      }
    });
  }, [id]);

  if (!att) return null;
  const p = att.project;

  const enterEnvironment = () => {
    studioActions.loadProject(p, att.id);
    setAttendanceStatus(att.id, "em-atendimento");
    openStudio();
    onClose();
  };

  const assumeWithArchitect = () => {
    const arch = availableArchitects()[0];
    if (arch) {
      const updated = assignArchitect(att.id, arch.id);
      if (updated) setAtt(updated);
    } else {
      setAtt(setAttendanceStatus(att.id, "em-atendimento"));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-champagne/10 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest2 text-champagne/80">Atendimento 3D</p>
          <h2 className="font-display text-xl text-text">{p.client.name || "Cliente sem nome"}</h2>
        </div>
        <button onClick={onClose} className="text-muted hover:text-text">✕</button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {p.thumbnail && (
          <img src={p.thumbnail} alt="Prévia" className="w-full rounded-lg border border-champagne/10" />
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Info label="Telefone" value={p.client.phone || "—"} />
          <Info label="E-mail" value={p.client.email || "—"} />
          <Info label="Cidade" value={p.client.city || "—"} />
          <Info label="Tipo de projeto" value={p.client.projectType || p.environment.typeLabel} />
          <Info label="Prazo" value={p.client.desiredDeadline || "—"} />
          <Info label="Faixa estimada" value={p.client.budgetRange || "—"} />
          <Info label="Ambiente" value={p.environment.typeLabel} />
          <Info label="Medidas" value={`${p.environment.width}×${p.environment.depth}×${p.environment.height} cm · ${p.environment.floors} andar(es)`} />
          <Info label="Estimativa" value={`${brl(p.estimate.min)}–${brl(p.estimate.max)}`} />
          <Info label="Arquiteto" value={att.architectName || "—"} />
          <Info label="Atualizado" value={new Date(att.updatedAt).toLocaleString("pt-BR")} />
        </div>

        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">Móveis ({p.furniture.length})</p>
          <ul className="space-y-1 rounded-lg border border-champagne/10 bg-surface/40 p-2 text-xs text-text">
            {p.furniture.length === 0 && <li className="text-muted">Nenhum móvel.</li>}
            {p.furniture.map((f) => (
              <li key={f.uid} className="flex justify-between gap-2">
                <span className="truncate">{f.name} · {(f.floor ?? 0) === 0 ? "Térreo" : `${(f.floor ?? 0) + 1}º andar`} · {MATERIAL_MAP[f.config.material]?.label}</span>
                <span className="text-muted">{f.width}×{f.height}×{f.depth}</span>
              </li>
            ))}
          </ul>
        </div>

        {p.client.notes && (
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">Observações</p>
            <p className="rounded-lg border border-champagne/10 bg-surface/40 p-2 text-xs text-text">{p.client.notes}</p>
          </div>
        )}

        {att.messages.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">Conversa</p>
            <div className="space-y-1.5 rounded-lg border border-champagne/10 bg-surface/40 p-2">
              {att.messages.map((m) => (
                <div key={m.id} className="text-xs">
                  <span className="text-champagne/80">{m.authorName}: </span>
                  <span className="text-text">{m.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ações */}
      <div className="space-y-2 border-t border-champagne/10 p-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${STATUS_META[att.status].cls}`}>
            {STATUS_META[att.status].label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="primary" size="sm" onClick={enterEnvironment}>Entrar no ambiente</Btn>
          <Btn size="sm" onClick={assumeWithArchitect}>Assumir atendimento</Btn>
          {p.client.phone && (
            <a
              href={whatsappUrl(p.client.phone, p.client.name)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-champagne/20 px-2.5 py-1.5 text-xs font-medium text-text transition hover:border-champagne/50 hover:bg-champagne/5"
            >
              Chamar no WhatsApp
            </a>
          )}
          {NEXT_STATUS.slice(1).map((s) => (
            <Btn key={s.status} size="sm" onClick={() => setAtt(setAttendanceStatus(att.id, s.status))}>
              {s.label}
            </Btn>
          ))}
          <Btn size="sm" onClick={() => exportHTML(p)}>Exportar resumo</Btn>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-champagne/10 bg-surface/40 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="truncate text-sm text-text">{value}</p>
    </div>
  );
}
