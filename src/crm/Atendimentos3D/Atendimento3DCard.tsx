import type { Attendance } from "../../features/studio3d-core/types";
import { brl } from "../../features/studio3d-core/pricingEngine";
import { STATUS_META, SCORE_META } from "./statusMeta";

export default function Atendimento3DCard({
  att,
  onOpen,
}: {
  att: Attendance;
  onOpen: () => void;
}) {
  const p = att.project;
  const st = STATUS_META[att.status];
  const sc = SCORE_META[p.leadScore];

  return (
    <button
      onClick={onOpen}
      className="flex w-full gap-3 rounded-xl border border-champagne/15 bg-surface/60 p-3 text-left transition hover:border-champagne/40 hover:bg-champagne/5"
    >
      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-champagne/10 bg-surfaceSoft">
        {p.thumbnail ? (
          <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted">sem prévia</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-text">{p.client.name || "Cliente sem nome"}</p>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${st.cls}`}>{st.label}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {p.client.projectType || p.environment.typeLabel} · {p.environment.floors} andar(es) · {p.furniture.length} móveis · {brl(p.estimate.min)}–{brl(p.estimate.max)}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
          {p.client.phone && <span>📞 {p.client.phone}</span>}
          {p.client.city && <span>· {p.client.city}</span>}
          <span className={`rounded-full px-1.5 py-0.5 ${sc.cls}`}>{sc.label}</span>
          {att.architectName && <span>· {att.architectName}</span>}
        </div>
      </div>
    </button>
  );
}
