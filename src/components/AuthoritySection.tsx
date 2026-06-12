import Reveal from "./Reveal";
import Icon from "./Icons";
import { siteData } from "../data/siteData";

export default function AuthoritySection() {
  const { authority } = siteData;

  return (
    <section id="capacidades" className="relative py-28 md:py-36">
      <div className="container-site">
        <Reveal>
          <p className="eyebrow mb-4">{authority.eyebrow}</p>
          <h2 className="heading-lg max-w-3xl">{authority.title}</h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {authority.text}
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {authority.cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.08}>
              <div className="card-premium h-full">
                <div className="mb-5 inline-flex rounded-md border border-champagne/20 bg-surfaceSoft p-3 text-champagne">
                  <Icon name={card.icon} />
                </div>
                <h3 className="mb-2 text-lg font-bold">{card.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{card.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="container-site mt-24">
        <div className="divider-gradient" />
      </div>
    </section>
  );
}
