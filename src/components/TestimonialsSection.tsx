import { useState } from "react";
import Reveal from "./Reveal";
import { siteData, type Testimonial } from "../data/siteData";

/** Inicial do nome para o fallback de avatar (sem foto). */
function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "•";
}

function Avatar({ testimonial }: { testimonial: Testimonial }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(testimonial.avatar) && !failed;

  if (showImage) {
    return (
      <img
        src={testimonial.avatar}
        alt={`Foto de ${testimonial.name}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-12 w-12 shrink-0 rounded-full border border-champagne/30 object-cover"
      />
    );
  }

  // Fallback elegante: inicial sobre disco champanhe
  return (
    <span
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-champagne/30 bg-surfaceSoft font-display text-lg text-champagne"
    >
      {initialOf(testimonial.name)}
    </span>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="card-premium flex h-full flex-col">
      {/* Aspas tipográficas em Playfair */}
      <span
        aria-hidden="true"
        className="font-display text-6xl leading-none text-champagne/30"
      >
        &ldquo;
      </span>
      <blockquote className="-mt-4 flex-1 text-base leading-relaxed text-text/90">
        {testimonial.quote}
      </blockquote>
      <figcaption className="mt-7 flex items-center gap-4 border-t border-white/5 pt-6">
        <Avatar testimonial={testimonial} />
        <div>
          <p className="text-sm font-bold text-text">{testimonial.name}</p>
          <p className="text-xs leading-relaxed text-muted">{testimonial.role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

export default function TestimonialsSection() {
  const { testimonials } = siteData;

  if (!testimonials?.items?.length) return null;

  return (
    <section id="depoimentos" className="py-28 md:py-36">
      <div className="container-site">
        <Reveal>
          <p className="eyebrow mb-4">{testimonials.eyebrow}</p>
          <h2 className="heading-lg max-w-3xl">{testimonials.title}</h2>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.items.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <TestimonialCard testimonial={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
