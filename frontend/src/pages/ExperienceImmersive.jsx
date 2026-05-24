import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ParallaxShowcase from "../components/ParallaxShowcase";

export default function ExperienceImmersive() {
  return (
    <div className="bg-[var(--ink)] min-h-screen" data-testid="experience-immersive-page">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[var(--ink)]/90 backdrop-blur-md">
        <div className="container-x flex items-center justify-between py-4 px-5 lg:px-12">
          <Link
            to="/"
            className="text-[11px] uppercase tracking-[0.22em] text-white/70 hover:text-[var(--gold)] flex items-center gap-2 transition-colors"
            data-testid="immersive-back-home"
          >
            <ArrowLeft size={14} /> Triad Realty
          </Link>
          <span className="overline text-[var(--gold)] hidden sm:inline">Immersive Experience</span>
          <Link to="/contact" className="btn-gold !py-3 !px-5" data-testid="immersive-contact">
            Consultation
          </Link>
        </div>
      </div>

      <ParallaxShowcase showIntro showOutro={false} />
    </div>
  );
}
