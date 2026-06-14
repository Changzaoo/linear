import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { siteData } from "../data/siteData";

/* Os valores exibidos aqui são editados em src/data/siteData.ts → numbers */

function CountUp({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className="font-display text-4xl text-champagne sm:text-5xl md:text-6xl">
      {prefix}
      {display.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

export default function TrustNumbers() {
  return (
    <section className="border-y border-white/5 bg-surface py-20 md:py-24">
      <div className="container-site grid grid-cols-2 gap-12 lg:grid-cols-4">
        {siteData.numbers.map((n) => (
          <div key={n.label} className="text-center">
            <CountUp value={n.value} prefix={n.prefix} suffix={n.suffix} />
            <p className="mt-3 text-sm font-medium uppercase tracking-wider text-muted">
              {n.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
