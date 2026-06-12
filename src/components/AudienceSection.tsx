import { motion } from "framer-motion";
import Reveal from "./Reveal";
import Icon from "./Icons";
import { siteData } from "../data/siteData";

export default function AudienceSection() {
  const { audience } = siteData;

  return (
    <section id="clientes" className="py-28 md:py-36">
      <div className="container-site">
        <Reveal>
          <p className="eyebrow mb-4">{audience.eyebrow}</p>
          <h2 className="heading-lg max-w-3xl">{audience.title}</h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {audience.items.map((item, i) => (
            <Reveal key={item.label} delay={i * 0.04}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group flex h-full flex-col items-start gap-4 rounded-lg border border-white/5 bg-surface p-6 transition-colors duration-300 hover:border-champagne/25"
              >
                <span className="text-muted transition-colors duration-300 group-hover:text-champagne">
                  <Icon name={item.icon} className="h-8 w-8" />
                </span>
                <span className="text-sm font-semibold">{item.label}</span>
              </motion.div>
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
