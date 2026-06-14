import { useEffect, useRef } from "react";
import { fpInput } from "./fpInput";
import { useOrc3d } from "./useOrcamento3DStore";

/* Controles touch para o modo primeira pessoa no mobile:
   joystick à esquerda (mover) e área livre à direita (olhar). */
export default function MobileControls() {
  const mode = useOrc3d((s) => s.viewMode);
  const knobRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const joyId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const lookLast = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (mode !== "primeira" && mode !== "terceira") {
      fpInput.forward = 0;
      fpInput.strafe = 0;
    }
  }, [mode]);

  if (mode !== "primeira" && mode !== "terceira") return null;

  const onJoyMove = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = (clientX - cx) / (r.width / 2);
    let dy = (clientY - cy) / (r.height / 2);
    const mag = Math.hypot(dx, dy) || 1;
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
    }
    fpInput.strafe = dx;
    fpInput.forward = -dy;
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx * 28}px, ${dy * 28}px)`;
  };

  const resetJoy = () => {
    fpInput.forward = 0;
    fpInput.strafe = 0;
    if (knobRef.current) knobRef.current.style.transform = "translate(0,0)";
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {/* joystick */}
      <div
        ref={baseRef}
        className="pointer-events-auto absolute bottom-24 left-6 h-28 w-28 touch-none rounded-full border border-champagne/30 bg-[rgba(18,16,14,0.55)] backdrop-blur-sm"
        onPointerDown={(e) => {
          joyId.current = e.pointerId;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          onJoyMove(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => joyId.current === e.pointerId && onJoyMove(e.clientX, e.clientY)}
        onPointerUp={() => { joyId.current = null; resetJoy(); }}
        onPointerCancel={() => { joyId.current = null; resetJoy(); }}
      >
        <div ref={knobRef} className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-champagne/40" />
      </div>

      {mode === "primeira" && (
        <div
          className="pointer-events-auto absolute bottom-0 right-0 top-0 w-1/2 touch-none"
          onPointerDown={(e) => { lookId.current = e.pointerId; lookLast.current = { x: e.clientX, y: e.clientY }; }}
          onPointerMove={(e) => {
            if (lookId.current !== e.pointerId || !lookLast.current) return;
            fpInput.lookDX += e.clientX - lookLast.current.x;
            fpInput.lookDY += e.clientY - lookLast.current.y;
            lookLast.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => { lookId.current = null; lookLast.current = null; }}
          onPointerCancel={() => { lookId.current = null; lookLast.current = null; }}
        />
      )}

      {/* sprint */}
      <button
        className="pointer-events-auto absolute bottom-44 left-8 rounded-full border border-champagne/30 bg-[rgba(18,16,14,0.6)] px-4 py-2 text-xs text-champagne backdrop-blur-sm active:bg-champagne/20"
        onPointerDown={() => (fpInput.sprint = true)}
        onPointerUp={() => (fpInput.sprint = false)}
        onPointerLeave={() => (fpInput.sprint = false)}
      >
        Correr
      </button>
    </div>
  );
}
