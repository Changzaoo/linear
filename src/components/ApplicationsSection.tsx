import Reveal from "./Reveal";
import { siteData } from "../data/siteData";

export default function ApplicationsSection() {
  const { applications } = siteData;

  return (
    <section className="py-28 md:py-36">
      <div className="container-site">
        <Reveal>
          <p className="eyebrow mb-4">{applications.eyebrow}</p>
          <h2 className="heading-lg max-w-4xl">{applications.title}</h2>
        </Reveal>

        <div className="mt-16 flex flex-wrap gap-3">
          {applications.items.map((item, i) => (
            <Reveal key={item} delay={i * 0.03}>
              <span className="inline-flex cursor-default items-center rounded-full border border-white/10 bg-surface px-6 py-3 text-sm font-medium text-muted transition-all duration-300 hover:border-champagne/40 hover:text-champagne hover:shadow-glow">
                {item}
              </span>
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
