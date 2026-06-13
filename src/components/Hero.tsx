import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ScrollFurnitureAssembly from "./ScrollFurnitureAssembly";
import Orcamento3DEntry from "../features/orcamento3d/Orcamento3DEntry";
import { siteData, whatsappLink } from "../data/siteData";

/**
 * Hero cinematográfico: seção alta (420vh) com canvas fixo.
 * O progresso do scroll controla a montagem 3D do ambiente.
 */
export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Texto inicial some quando a montagem começa
  const introOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.1], [0, -60]);
  // Quando invisível, não pode bloquear cliques/scroll sobre a cena
  const introPointer = useTransform(introOpacity, (v) => (v < 0.05 ? "none" : "auto"));
  // Frase final aparece com o ambiente completo
  const finalOpacity = useTransform(scrollYProgress, [0.86, 0.96], [0, 1]);
  const finalBlur = useTransform(scrollYProgress, [0.86, 0.96], ["blur(10px)", "blur(0px)"]);
  // Dica de scroll
  const hintOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  const { hero } = siteData;

  return (
    <section id="inicio" ref={containerRef} className="relative h-[320vh] md:h-[420vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Cena 3D */}
        <div className="absolute inset-0">
          <ScrollFurnitureAssembly progress={scrollYProgress} />
        </div>

        {/* Vinheta para legibilidade do texto */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(8,7,6,0.75)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

        {/* Conteúdo inicial */}
        <motion.div
          style={{ opacity: introOpacity, y: introY, pointerEvents: introPointer }}
          className="absolute inset-0 flex items-center"
        >
          <div className="container-site">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="eyebrow mb-6"
            >
              {siteData.brand.name} · {siteData.brand.tagline}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.35 }}
              className="heading-xl max-w-3xl"
            >
              {hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.6 }}
              className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg"
            >
              {hero.subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.85 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full sm:w-auto"
                aria-label="Solicitar proposta pelo WhatsApp"
              >
                {hero.ctaPrimary}
              </a>
              <a
                href="#capacidades"
                className="btn-secondary w-full sm:w-auto"
                aria-label="Ver capacidades técnicas"
              >
                {hero.ctaSecondary}
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Frase final da montagem */}
        <motion.div
          style={{ opacity: finalOpacity, filter: finalBlur }}
          className="pointer-events-none absolute inset-x-0 bottom-[34vh] flex justify-center px-6"
        >
          <p className="max-w-2xl text-center font-display text-2xl italic text-text md:text-4xl">
            “{hero.finalPhrase}”
          </p>
        </motion.div>

        {/* Chamada do Estúdio 3D de Orçamento — surge com a cena montada */}
        <Orcamento3DEntry progress={scrollYProgress} />

        {/* Indicador de scroll */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-2 text-muted">
            <span className="text-[10px] uppercase tracking-widest2">Role para montar</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="h-9 w-px bg-gradient-to-b from-champagne to-transparent"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
