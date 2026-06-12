import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "./Reveal";
import { siteData } from "../data/siteData";

type Project = (typeof siteData.portfolio.projects)[number];

/** Card com placeholder em gradiente (substitua por fotos reais quando disponíveis). */
function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="group relative block w-full overflow-hidden rounded-lg border border-white/5 text-left shadow-card focus:outline-none focus:ring-2 focus:ring-champagne"
      aria-label={`Ver detalhes do projeto: ${project.title}`}
    >
      {/* Placeholder visual em gradiente */}
      <div className={`relative h-72 bg-gradient-to-br ${project.gradient}`}>
        {/* Ripas decorativas em CSS */}
        <div className="absolute inset-0 flex items-end justify-center gap-2 pb-10 opacity-40 transition-opacity duration-500 group-hover:opacity-70">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="w-2 rounded-sm bg-gradient-to-b from-bronze/60 to-transparent"
              style={{ height: `${46 + ((i * 37) % 70)}px` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6">
        <span className="eyebrow">{project.category}</span>
        <h3 className="mt-2 font-display text-xl">{project.title}</h3>
        <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-champagne opacity-0 transition-all duration-300 group-hover:opacity-100">
          Ver projeto
          <span className="h-px w-6 bg-champagne" />
        </span>
      </div>
    </motion.button>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  // Fecha com Esc e trava o scroll do body
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const fields = [
    { label: "Tipo de projeto", value: project.category },
    { label: "Escopo", value: project.scope },
    { label: "Materiais", value: project.materials },
    { label: "Prazo", value: project.deadline },
    { label: "Desafio", value: project.challenge },
    { label: "Solução", value: project.solution },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm md:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes do projeto ${project.title}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-40 bg-gradient-to-br ${project.gradient}`} />
        <div className="p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <span className="eyebrow">{project.category}</span>
              <h3 className="mt-2 font-display text-2xl md:text-3xl">{project.title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="rounded-md border border-white/10 p-2.5 text-muted transition-colors hover:border-champagne/40 hover:text-champagne focus:outline-none focus:ring-2 focus:ring-champagne"
              aria-label="Fechar detalhes do projeto"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <dl className="space-y-5">
            {fields.map((f) => (
              <div key={f.label} className="border-b border-white/5 pb-5 last:border-0">
                <dt className="mb-1 text-xs font-bold uppercase tracking-widest2 text-champagne">
                  {f.label}
                </dt>
                <dd className="text-sm leading-relaxed text-muted">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PortfolioSection() {
  const [active, setActive] = useState<Project | null>(null);
  const { portfolio } = siteData;

  return (
    <section id="portfolio" className="py-28 md:py-36">
      <div className="container-site">
        <Reveal>
          <p className="eyebrow mb-4">{portfolio.eyebrow}</p>
          <h2 className="heading-lg max-w-3xl">{portfolio.title}</h2>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolio.projects.map((project, i) => (
            <Reveal key={project.id} delay={i * 0.06}>
              <ProjectCard project={project} onOpen={() => setActive(project)} />
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && <ProjectModal project={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </section>
  );
}
