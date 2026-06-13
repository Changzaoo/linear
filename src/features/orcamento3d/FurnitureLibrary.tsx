import { useMemo, useState } from "react";
import { FURNITURE_CATALOG, CATEGORY_LABELS } from "./furnitureCatalog";
import { actions } from "./useOrcamento3DStore";
import { brl } from "./pricingEngine";
import FurniturePreview from "./FurniturePreview";
import type { FurnitureCategory } from "./types";

const COMPLEXITY_DOT: Record<string, string> = {
  simples: "bg-emerald-400/70",
  medio: "bg-amber-400/70",
  alto: "bg-rose-400/70",
};

export default function FurnitureLibrary() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<FurnitureCategory | "todos">("todos");

  const cats = useMemo(() => {
    const set = new Set(FURNITURE_CATALOG.map((f) => f.category));
    return Array.from(set);
  }, []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FURNITURE_CATALOG.filter(
      (f) => (cat === "todos" || f.category === cat) && (!q || f.name.toLowerCase().includes(q))
    );
  }, [query, cat]);

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar móvel…"
          className="w-full rounded-lg border border-champagne/20 bg-surface/60 px-3 py-2 text-sm text-text outline-none placeholder:text-muted/60 focus:border-champagne/50"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => setCat("todos")}
            className={`rounded-full px-2.5 py-1 text-[11px] ${cat === "todos" ? "bg-champagne/20 text-text" : "text-muted hover:text-text"}`}
          >
            Todos
          </button>
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-2.5 py-1 text-[11px] ${cat === c ? "bg-champagne/20 text-text" : "text-muted hover:text-text"}`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto px-3 pb-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => actions.addFurniture(it)}
            className="group rounded-lg border border-champagne/15 bg-surface/40 p-2.5 text-left transition hover:border-champagne/45 hover:bg-champagne/5"
          >
            {/* silhueta técnica por categoria */}
            <div className="mb-2 flex h-16 items-center justify-center rounded bg-gradient-to-b from-[#241d15] to-[#12100e] p-1">
              <FurniturePreview category={it.category} id={it.id} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${COMPLEXITY_DOT[it.complexity]}`} />
              <p className="truncate text-xs font-medium text-text">{it.name}</p>
            </div>
            <p className="mt-0.5 text-[10px] text-muted">
              {it.defaultWidth}×{it.defaultHeight}×{it.defaultDepth} · a partir de {brl(it.basePrice)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
