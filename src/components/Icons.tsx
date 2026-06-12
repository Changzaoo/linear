/** Conjunto de ícones minimalistas em linha fina, no tom champagne. */

interface IconProps {
  name: string;
  className?: string;
}

const paths: Record<string, JSX.Element> = {
  blueprint: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 9h7v6H3M10 9v12M10 15h11" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
    </>
  ),
  ruler: (
    <>
      <rect x="2" y="9" width="20" height="6" rx="1" />
      <path d="M6 9v3M10 9v2M14 9v3M18 9v2" />
    </>
  ),
  tools: (
    <>
      <path d="M14 4l6 6-9 9H5v-6l9-9z" />
      <path d="M12 6l6 6" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </>
  ),
  handshake: (
    <>
      <path d="M3 11l4-4 5 1 5-1 4 4" />
      <path d="M7 7v7l5 5 5-5V7M9.5 14l2.5 2.5L14.5 14" />
    </>
  ),
  store: (
    <>
      <path d="M4 9l1.5-5h13L20 9" />
      <path d="M4 9v11h16V9M4 9a2.6 2.6 0 005.3 0A2.6 2.6 0 0014.6 9 2.6 2.6 0 0020 9M9 20v-6h6v6" />
    </>
  ),
  franchise: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  restaurant: (
    <>
      <path d="M7 3v8M5 3v4a2 2 0 004 0V3M7 11v10" />
      <path d="M16 3c-1.5 0-3 2-3 5s1.5 4 3 4v9M16 3v18" />
    </>
  ),
  clinic: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  hotel: (
    <>
      <path d="M3 20V8l9-5 9 5v12" />
      <path d="M3 20h18M9 20v-5h6v5M9 11h.01M15 11h.01M12 11h.01" />
    </>
  ),
  office: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="1" />
      <path d="M9 6V4h6v2M3 12h18" />
    </>
  ),
  crane: (
    <>
      <path d="M5 21V7l4-4h2v18M5 7h14v3M17 10v4M17 16v.01" />
      <path d="M3 21h12" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="6" r="2" />
      <path d="M12 8l-6 13M12 8l6 13M8.5 16h7" />
    </>
  ),
  towers: (
    <>
      <path d="M4 21V9h6v12M14 21V4h6v17M4 21h16" />
      <path d="M7 12h.01M7 15h.01M17 8h.01M17 11h.01M17 14h.01" />
    </>
  ),
  showroom: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="1" />
      <path d="M3 17l4 4M21 17l-4 4M8 8h8M8 12h5" />
    </>
  ),
  kiosk: (
    <>
      <path d="M4 8l2-4h12l2 4H4z" />
      <path d="M5 8v12h14V8M9 20v-7h6v7" />
    </>
  ),
  retail: (
    <>
      <path d="M6 6h15l-2 8H8L6 3H3" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z" />
      <path d="M9 8.5c0 4 2.5 6.5 6.5 6.5l1-2-2.2-1-1 .8c-1.2-.6-1.9-1.3-2.4-2.4l.8-1-1-2.2-1.7.3z" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export default function Icon({ name, className = "h-7 w-7" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? paths.check}
    </svg>
  );
}
