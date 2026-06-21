import { lazy, Suspense, useEffect, useRef, useState } from "react";
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
import TestimonialsSection from "./components/TestimonialsSection";
import PartnersSection from "./components/PartnersSection";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import ProposalModal from "./components/ProposalModal";
import { useLenis } from "./lib/useLenis";
import { openStudio, useStudioOpen } from "./features/orcamento3d/useOrcamento3DStore";

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
      <p className="animate-pulse font-display text-lg italic text-champagne">Pressione ENTER para iniciar seu orçamento 3D</p>
    </div>
  );
}

export default function App() {
  const hash = useHash();
  const studioOpen = useStudioOpen();
  const isCrm = hash.startsWith("#/crm") || hash.startsWith("#crm");

  // desliga o scroll suavizado dentro do estúdio/CRM (painéis com scroll próprio)
  useLenis(!studioOpen && !isCrm);

  useEffect(() => {
    if (hash.startsWith("#/orcamento-3d") || hash.startsWith("#orcamento-3d")) openStudio();
  }, [hash]);

  // Ao sair do CRM (voltar para o site), rola de volta para o topo.
  const wasCrm = useRef(isCrm);
  useEffect(() => {
    if (wasCrm.current && !isCrm) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    wasCrm.current = isCrm;
  }, [isCrm]);

  return (
    <>
      {isCrm ? (
        <Suspense fallback={<StudioLoading />}>
          <Atendimentos3DPage />
        </Suspense>
      ) : (
        // Enquanto o estúdio 3D está aberto, escondemos a landing page inteira:
        // assim a tela antiga com os objetos 3D some, para de rolar e os canvases
        // WebGL deixam de renderizar (não ficam atrás do editor consumindo GPU).
        !studioOpen && (
        <>
          <Header />
          <main>
            <Hero />
            <AuthoritySection />
            <ExplodedCounter3D />
            <AudienceSection />
            <ProcessSection />
            <DifferentialsSection />
            <ApplicationsSection />
            <TrustNumbers />
            <PortfolioSection />
            <TestimonialsSection />
            <PartnersSection />
            <FinalCTA />
          </main>
          <Footer />
          <WhatsAppButton />
        </>
        )
      )}

      {/* Modal "Solicitar proposta" — abre de qualquer CTA do site e
          cai na fileira Lead do funil comercial do CRM. */}
      <ProposalModal />

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
