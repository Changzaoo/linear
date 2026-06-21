import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "./Reveal";
import { siteData, type PortfolioProject } from "../data/siteData";

type Project = PortfolioProject;

/** Reúne as fotos do projeto (galeria > imagem única) sem duplicar. */
function projectImages(project: Project): string[] {
  if (project.images && project.images.length > 0) return project.images;
  if (project.image) return [project.image];
  return [];
}

/** Card do portfólio: foto real quando houver, gradiente como fallback elegante. */
function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const cover = project.image ?? project.images?.[0];
  const showImage = Boolean(cover) && !imgFailed;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="group relative block w-full overflow-hidden rounded-lg border border-white/5 text-left shadow-card transition-shadow duration-300 hover:border-champagne/25 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Ver detalhes do projeto: ${project.title}`}
    >
      {/* Aspect-ratio fixo para um grid impecável */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {showImage ? (
          <img
            src={cover}
            alt={`${project.title} — ${project.category} executada pela NEXUS`}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          // Fallback: gradiente + ripas decorativas (comportamento original)
          <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient}`}>
            <div
              className="absolute inset-0 flex items-end justify-center gap-2 pb-10 opacity-40 transition-opacity duration-500 group-hover:opacity-70"
              aria-hidden="true"
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 rounded-sm bg-gradient-to-b from-bronze/60 to-transparent"
                  style={{ height: `${46 + ((i * 37) % 70)}px` }}
                />
              ))}
            </div>
          </div>
        )}
        {/* Véu inferior: garante legibilidade do título sobre foto ou gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent transition-opacity duration-500 group-hover:from-background/95" />
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

/** Galeria/lightbox acessível: setas + ESC, com aria-live para leitor de tela. */
function Gallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const total = images.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + total) % total),
    [total]
  );

  // Navegação por teclado dentro da galeria (setas).
  useEffect(() => {
    if (total < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  if (failed[index] && Object.keys(failed).length >= total) return null;

  return (
    <div
      className="relative aspect-[16/10] overflow-hidden bg-surfaceSoft"
      role="group"
      aria-roledescription="carrossel"
      aria-label={`Galeria de fotos — ${title}`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.img
          key={index}
          src={images[index]}
          alt={`${title} — foto ${index + 1} de ${total}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed((f) => ({ ...f, [index]: true }))}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {/* Atualização para leitores de tela */}
      <span className="sr-only" aria-live="polite">
        Foto {index + 1} de {total}
      </span>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-background/60 p-2.5 text-text backdrop-blur-sm transition-colors hover:border-champagne/50 hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
            aria-label="Foto anterior"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-background/60 p-2.5 text-text backdrop-blur-sm transition-colors hover:border-champagne/50 hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
            aria-label="Próxima foto"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Indicadores / miniaturas-pontos */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir para foto ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne ${
                  i === index ? "w-6 bg-champagne" : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const images = projectImages(project);

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
        {/* Galeria de fotos reais, ou banner em gradiente como fallback */}
        {images.length > 0 ? (
          <Gallery images={images} title={project.title} />
        ) : (
          <div className={`h-40 bg-gradient-to-br ${project.gradient}`} aria-hidden="true" />
        )}

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
              className="rounded-md border border-white/10 p-2.5 text-muted transition-colors hover:border-champagne/40 hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
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
