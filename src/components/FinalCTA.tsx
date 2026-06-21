import Reveal from "./Reveal";
import { siteData, whatsappLink } from "../data/siteData";
import { openProposal } from "../lib/proposal";
import { useMagnetic } from "../lib/useMagnetic";

export default function FinalCTA() {
  const { finalCta } = siteData;
  // Magnetismo leve no CTA principal (desktop/mouse; off em touch e reduced-motion).
  const magnetRef = useMagnetic<HTMLSpanElement>();

  return (
    <section id="contato" className="relative overflow-hidden py-32 md:py-44">
      {/* Brilho quente de fundo */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(216,185,120,0.08),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="container-site relative text-center">
        <Reveal>
          <h2 className="heading-xl mx-auto max-w-4xl">{finalCta.title}</h2>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {finalCta.subtitle}
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <span ref={magnetRef} className="inline-flex w-full will-change-transform sm:w-auto">
              <button
                type="button"
                onClick={openProposal}
                className="btn-primary w-full sm:w-auto"
                aria-label="Solicitar proposta"
              >
                {finalCta.ctaPrimary}
              </button>
            </span>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full sm:w-auto"
              aria-label="Enviar projeto pelo WhatsApp"
            >
              {finalCta.ctaSecondary}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
