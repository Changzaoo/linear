import Reveal from "./Reveal";
import { siteData, whatsappLink } from "../data/siteData";

export default function PartnersSection() {
  const { partners } = siteData;

  return (
    <section className="py-28 md:py-36">
      <div className="container-site">
        <div className="rounded-lg border border-champagne/15 bg-gradient-to-br from-surface to-surfaceSoft p-10 md:p-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="eyebrow mb-4">{partners.eyebrow}</p>
              <h2 className="heading-lg">{partners.title}</h2>
              <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
                {partners.text}
              </p>
              <a
                href={whatsappLink(
                  "Olá, sou arquiteto/construtora e gostaria de falar com a equipe técnica sobre um projeto."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-10"
                aria-label="Falar com a equipe técnica pelo WhatsApp"
              >
                {partners.cta}
              </a>
            </Reveal>

            <Reveal delay={0.15}>
              <ul className="space-y-5">
                {partners.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-4">
                    <span className="h-px w-10 shrink-0 bg-champagne/60" aria-hidden="true" />
                    <span className="text-sm font-medium md:text-base">{bullet}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
