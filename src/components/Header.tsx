import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { siteData } from "../data/siteData";
import { openProposal } from "../lib/proposal";

/** Menu fixo com fundo blur que se intensifica após o scroll. */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/5 bg-background/80 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="container-site flex h-20 items-center justify-between">
        <a href="#inicio" className="flex items-baseline gap-2" aria-label="Voltar ao início">
          <span className="font-display text-2xl tracking-wide text-text">
            {siteData.brand.name}
          </span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-widest2 text-champagne sm:inline">
            {siteData.brand.tagline}
          </span>
        </a>

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {siteData.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-sm text-sm font-medium text-muted transition-colors hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={openProposal}
            className="rounded-md border border-champagne/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-champagne transition-all hover:border-champagne hover:bg-champagne/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Solicitar proposta"
          >
            Solicitar proposta
          </button>
        </nav>

        {/* Botão mobile */}
        <button
          type="button"
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          <span
            className={`h-px w-6 bg-text transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`h-px w-6 bg-text transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-b border-white/5 bg-background/95 backdrop-blur-md lg:hidden"
            aria-label="Navegação mobile"
          >
            <div className="container-site flex flex-col gap-1 py-4">
              {siteData.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base font-medium text-muted transition-colors hover:bg-surface hover:text-champagne"
                >
                  {item.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => { setOpen(false); openProposal(); }}
                className="btn-primary mt-3"
                aria-label="Solicitar proposta"
              >
                Solicitar proposta
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
