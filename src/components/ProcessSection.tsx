import { motion } from "framer-motion";
import Reveal from "./Reveal";
import { siteData } from "../data/siteData";

/** Timeline vertical: cada etapa surge conforme o scroll. */
export default function ProcessSection() {
  const { process } = siteData;

  return (
    <section id="processo" className="py-28 md:py-36">
      <div className="container-site">
        <Reveal>
          <p className="eyebrow mb-4">{process.eyebrow}</p>
          <h2 className="heading-lg max-w-3xl">{process.title}</h2>
        </Reveal>

        <div className="relative mt-20">
          {/* Linha vertical da timeline */}
          <div
            className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-champagne/50 via-champagne/15 to-transparent md:left-1/2"
            aria-hidden="true"
          />

          <ol className="space-y-12">
            {process.steps.map((step, i) => {
              const left = i % 2 === 0;
              return (
                <li key={step.title} className="relative">
                  <motion.div
                    initial={{ opacity: 0, x: left ? -32 : 32 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                    className={`relative ml-14 md:ml-0 md:w-[calc(50%-3rem)] ${
                      left ? "" : "md:ml-auto"
                    }`}
                  >
                    {/* Marcador na linha */}
                    <span
                      className={`absolute -left-14 top-1 flex h-10 w-10 items-center justify-center rounded-full border border-champagne/40 bg-surface text-xs font-bold text-champagne md:top-0 ${
                        left
                          ? "md:-left-14 md:translate-x-0 lg:left-auto lg:-right-[4.25rem]"
                          : "md:-left-[4.25rem]"
                      }`}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="rounded-lg border border-white/5 bg-surface p-6 shadow-card transition-colors duration-300 hover:border-champagne/25">
                      <h3 className="mb-1.5 text-base font-bold">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-muted">{step.desc}</p>
                    </div>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <div className="container-site mt-24">
        <div className="divider-gradient" />
      </div>
    </section>
  );
}
