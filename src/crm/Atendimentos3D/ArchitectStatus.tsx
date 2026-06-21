import { useEffect, useState } from "react";
import { listArchitects, updateArchitectStatus, onCrmEvent } from "../../features/studio3d-core/crmBridge";
import type { Architect, ArchitectStatus as Status } from "../../features/studio3d-core/types";

const STATUS: { value: Status; label: string; cls: string }[] = [
  { value: "disponivel", label: "Disponível", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" },
  { value: "ocupado", label: "Ocupado", cls: "bg-amber-500/20 text-amber-300 border-amber-400/40" },
  { value: "ausente", label: "Ausente", cls: "bg-zinc-500/20 text-zinc-300 border-zinc-400/30" },
];

export default function ArchitectStatus() {
  const [list, setList] = useState<Architect[]>([]);

  useEffect(() => {
    setList(listArchitects());
    return onCrmEvent((e) => {
      if (e.type === "architects-updated") setList(e.architects);
      else if (e.type === "sync") setList(listArchitects());
    });
  }, []);

  return (
    <div className="rounded-xl border border-champagne/15 bg-surface/60 p-4">
      <h3 className="mb-3 text-[11px] uppercase tracking-widest2 text-champagne/80">Equipe disponível</h3>
      <div className="space-y-2">
        {list.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2">
            <span className="text-sm text-text">{a.name}</span>
            <div className="flex gap-1">
              {STATUS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setList(updateArchitectStatus(a.id, s.value))}
                  className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                    a.status === s.value ? s.cls : "border-champagne/15 text-muted hover:text-text"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
