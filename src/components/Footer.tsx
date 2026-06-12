import { siteData, whatsappLink } from "../data/siteData";

export default function Footer() {
  const { brand, contact, nav } = siteData;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-surface">
      <div className="container-site grid gap-12 py-16 md:grid-cols-3">
        {/* Marca */}
        <div>
          <p className="font-display text-2xl">{brand.name}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest2 text-champagne">
            {brand.tagline}
          </p>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">{brand.specialty}</p>
        </div>

        {/* Links rápidos */}
        <nav aria-label="Links rápidos">
          <p className="mb-5 text-xs font-bold uppercase tracking-widest2 text-muted">
            Navegação
          </p>
          <ul className="space-y-3">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-muted transition-colors hover:text-champagne"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contato */}
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-widest2 text-muted">Contato</p>
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-champagne"
                aria-label="WhatsApp"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contact.email}`}
                className="transition-colors hover:text-champagne"
              >
                {contact.email}
              </a>
            </li>
            <li>
              <a
                href={contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-champagne"
                aria-label="Instagram"
              >
                {contact.instagram}
              </a>
            </li>
            <li>{contact.location}</li>
            {contact.cnpj && <li>CNPJ: {contact.cnpj}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted md:flex-row">
          <p>
            © {year} {brand.name} — {brand.tagline}. Todos os direitos reservados.
          </p>
          <p className="opacity-60">Mobiliário sob medida para grandes operações.</p>
        </div>
      </div>
    </footer>
  );
}
