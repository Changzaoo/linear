import Reveal from "./Reveal";
import { siteData } from "../data/siteData";

export default function DifferentialsSection() {
  const { differentials } = siteData;

  return (
    <section className="py-28 md:py-36">
      <div className="container-site">
        <Reveal>
          <p className="eyebrow mb-4">{differentials.eyebrow}</p>
          <h2 className="heading-lg max-w-3xl">{differentials.title}</h2>
        </Reveal>

        <div className="mt-16 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {differentials.items.map((item, i) => (
            <Reveal key={item} delay={i * 0.04}>
              <div className="group flex items-center gap-4 border-b border-white/5 pb-5 transition-colors duration-300 hover:border-champagne/30">
                <span
                  className="h-px w-8 shrink-0 bg-champagne/50 transition-all duration-300 group-hover:w-12 group-hover:bg-champagne"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold md:text-base">{item}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
