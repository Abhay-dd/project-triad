import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  useParallaxCapability,
  useParallaxReveal,
  useParallaxScroll,
} from "../hooks/useParallax";
import { IMMERSIVE_SECTIONS } from "../data";
import "./ParallaxShowcase.css";

function ParallaxSection({ section, index, lite }) {
  return (
    <article
      className="parallax-section"
      data-parallax-section={lite ? undefined : ""}
      data-testid={`parallax-section-${section.id}`}
      aria-label={section.title}
    >
      <div className="parallax-section__sticky">
        <div className="parallax-section__bg" aria-hidden="true">
          <img
            src={section.image}
            alt=""
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        </div>
        <div className="parallax-section__veil" aria-hidden="true" />
        <div className="parallax-section__grain" aria-hidden="true" />
        <span className="parallax-section__index" aria-hidden="true">
          {section.index}
        </span>
      </div>

      <div className="parallax-section__content">
        <div className="parallax-section__panel">
          <div className="parallax-section__card" data-parallax-reveal="">
            <div className="overline text-[var(--gold)]">{section.overline}</div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-[56px] leading-[1.02] mt-4">
              {section.title}
            </h2>
            <p className="text-white/75 leading-relaxed mt-5 text-base md:text-lg">
              {section.body}
            </p>

            <div className="parallax-section__stats">
              {section.stats.map((s) => (
                <div key={s.label} className="parallax-section__stat">
                  <div className="parallax-section__stat-label">{s.label}</div>
                  <div className="parallax-section__stat-value tabular">{s.value}</div>
                </div>
              ))}
            </div>

            {section.cta && (
              <Link
                to={section.cta.to}
                className="btn-ghost-light mt-8 inline-flex"
                data-testid={`parallax-cta-${section.id}`}
              >
                {section.cta.label} <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ParallaxShowcase({
  showIntro = true,
  showOutro = true,
  className = "",
}) {
  const rootRef = useRef(null);
  const revealRef = useParallaxReveal(true);
  const { lite } = useParallaxCapability();
  useParallaxScroll(rootRef, !lite);

  const setRoot = (node) => {
    rootRef.current = node;
    revealRef.current = node;
  };

  return (
    <section
      ref={setRoot}
      className={`parallax-showcase ${lite ? "parallax-showcase--lite" : ""} ${className}`.trim()}
      data-testid="parallax-showcase"
      aria-label="Immersive Dubai property experience"
    >
      {showIntro && (
        <header className="parallax-showcase__intro">
          <div className="container-x">
            <div className="overline text-[var(--gold)]" data-parallax-reveal="">
              Immersive Experience
            </div>
            <h2
              className="font-display text-4xl md:text-6xl mt-5 max-w-3xl mx-auto leading-[1.02]"
              data-parallax-reveal=""
            >
              Four addresses. <em className="text-[var(--gold)] not-italic">One horizon.</em>
            </h2>
            <p
              className="text-white/65 mt-6 max-w-xl mx-auto leading-relaxed"
              data-parallax-reveal=""
            >
              Scroll through Dubai&apos;s most sought-after corridors — off-plan towers, marina
              skylines, and palm-fringed waterfronts, curated by Triad analysts.
            </p>
          </div>
        </header>
      )}

      {IMMERSIVE_SECTIONS.map((section, index) => (
        <ParallaxSection key={section.id} section={section} index={index} lite={lite} />
      ))}

      {showOutro && (
        <footer className="parallax-showcase__outro">
          <div className="container-x" data-parallax-reveal="">
            <p className="overline text-[var(--gold)] mb-4">Continue exploring</p>
            <Link
              to="/experience-immersive"
              className="btn-gold"
              data-testid="parallax-full-experience"
            >
              Full immersive journey <ArrowRight size={14} />
            </Link>
            <p className="text-white/50 text-sm mt-6 max-w-md mx-auto">
              {lite
                ? "Motion-reduced or mobile layout — rich scroll effects are available on desktop."
                : "Prefer a focused view? Open the dedicated experience page."}
            </p>
          </div>
        </footer>
      )}
    </section>
  );
}
