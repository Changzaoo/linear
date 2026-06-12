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

export default function App() {
  useLenis();

  return (
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
  );
}
