import { lazy, Suspense, useEffect, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import AuthoritySection from "./components/AuthoritySection";
import AudienceSection from "./components/AudienceSection";
import ProcessSection from "./components/ProcessSection";
import DifferentialsSection from "./components/DifferentialsSection";
import ExplodedCounter3D from "./components/ExplodedCounter3D";
import ApplicationsSection from "./components/ApplicationsSection";
import TrustNumbers from "./components/TrustNumbers";
import PortfolioSection from "./components/PortfolioSection";
import PartnersSection from "./components/PartnersSection";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import { useLenis } from "./lib/useLenis";
import { useStudioOpen } from "./features/orcamento3d/useOrcamento3DStore";

// Carregados sob demanda — não pesam o bundle inicial do site.
const Orcamento3DApp = lazy(() => import("./features/orcamento3d/Orcamento3DApp"));
const Atendimentos3DPage = lazy(() => import("./crm/Atendimentos3D/Atendimentos3DPage"));

function useHash() {
  const [hash, setHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

function StudioLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0a08]">
      <p className="animate-pulse font-display text-lg italic text-champagne">Preparando seu estúdio 3D…</p>
    </div>
  );
}

export default function App() {
  const hash = useHash();
  const studioOpen = useStudioOpen();
  const isCrm = hash.startsWith("#/crm") || hash.startsWith("#crm");

  // desliga o scroll suavizado dentro do estúdio/CRM (painéis com scroll próprio)
  useLenis(!studioOpen && !isCrm);

  return (
    <>
      {isCrm ? (
        <Suspense fallback={<StudioLoading />}>
          <Atendimentos3DPage />
        </Suspense>
      ) : (
        <>
          <Header />
          <main>
            <Hero />
            <AuthoritySection />
            <AudienceSection />
            <ProcessSection />
            <DifferentialsSection />
            <ExplodedCounter3D />
            <ApplicationsSection />
            <TrustNumbers />
            <PortfolioSection />
            <PartnersSection />
            <FinalCTA />
          </main>
          <Footer />
          <WhatsAppButton />
        </>
      )}

      {/* Estúdio 3D sobre qualquer rota — inclusive quando o arquiteto
          entra num projeto a partir do CRM. */}
      {studioOpen && (
        <Suspense fallback={<StudioLoading />}>
          <Orcamento3DApp />
        </Suspense>
      )}
    </>
  );
}
