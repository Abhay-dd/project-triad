import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Phone, Mail, Star, Quote } from "lucide-react";
import axios from "axios";
import { reallyApi } from "../services/api/realEstateApi";
import PartnerDevelopers from "../components/PartnerDevelopers";
import {
  MILESTONES,
  REVIEWS,
  WHY_TRIAD,
  COMPANY,
} from "../data";

import { API_URL as API } from "../config";

const VIDEO_SRC = "/videos/AWARD_AZIZI.mov";

const DEFAULT_HOMEPAGE_SETTINGS = {
  launch_title: "Why Triad Realty?",
  launch_description:
    "Renowned for curated UAE launches, sharp market intelligence, and client-first advisory, Triad Realty blends developer access with disciplined investment guidance.",
  launch_video_url: "",
  stat1_value: "50,000+",
  stat1_label: "Homes delivered*",
  stat2_value: "54,000+",
  stat2_label: "In planning and progress*",
  stat3_value: "100+",
  stat3_label: "Awards received",
  stat4_value: "9",
  stat4_label: "Countries",
  founders_image_url: "/three_founders.jpg",
};

const extractYouTubeId = (url = "") => {
  const match = String(url).match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|v\/|watch\?v=|watch\?.+&v=))([^&?/]+)/
  );
  return match?.[1] || "";
};

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [homepageSettings, setHomepageSettings] = useState(DEFAULT_HOMEPAGE_SETTINGS);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      reallyApi.getProperties({ perPage: 3 }),
      axios.get(`${API}/team`),
      axios.get(`${API}/settings/homepage`),
    ]).then(([projectRes, teamRes, settingsRes]) => {
      if (!isMounted) return;
      if (projectRes.status === "fulfilled") setProjects(projectRes.value.properties || []);
      if (teamRes.status === "fulfilled") setTeam(teamRes.value.data.results || []);
      if (settingsRes.status === "fulfilled") {
        setHomepageSettings({ ...DEFAULT_HOMEPAGE_SETTINGS, ...(settingsRes.value.data || {}) });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);



  return (
    <>
      {/* HERO — local video */}
      <section className="relative h-screen w-full overflow-hidden bg-[var(--ink)]" data-testid="home-hero">
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover pointer-events-none"
            data-testid="hero-video"
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
          {/* subtle dark overlay */}
          <div className="absolute inset-0 z-[2] bg-black/20" />
          {/* mobile-only: covers the in-video Triad award logo in portrait crop */}
          <div className="absolute top-0 inset-x-0 z-[3] xl:hidden" style={{height: '80px', background: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0) 100%)'}} />
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-[10px] uppercase tracking-[0.4em] flex flex-col items-center gap-3 z-10">
          <span>Scroll</span>
          <div className="w-px h-10 bg-white/40 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-4 bg-[var(--gold)] scroll-cue" />
          </div>
        </div>
      </section>

      {/* HERO COPY — moved out of the video */}
      <section className="section-pad bg-[var(--ink)] text-white relative overflow-hidden" data-testid="home-intro">
        <div className="container-x relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <div className="overline text-[var(--gold)]">Triad Realty · Since 2025</div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-[88px] leading-[0.95] mt-6">
              The address you<br />will be known for.
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p className="text-white/80 leading-relaxed">
              Discreet, data-led property consultancy across Dubai and the Northern Emirates — for off-plan investments, resale acquisitions, and portfolios built to last.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/projects" className="btn-ghost-light" data-testid="hero-cta-projects">
                Explore Projects <ArrowRight size={14} />
              </Link>
              <Link to="/contact" className="text-white text-[12px] uppercase tracking-[0.22em] flex items-center gap-2 px-2 py-3 border-b border-[var(--gold)]">
                Schedule consultation <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="section-pad bg-white" data-testid="home-about">
        <div className="container-x grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5" data-reveal>
            <div className="overline text-[var(--gold-deep)]">Who We Are</div>
            <h2 className="font-display text-4xl md:text-6xl leading-[1.02] mt-5">
              Three consultants. <em className="text-[var(--gold-deep)]">One conviction.</em>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pt-10" data-reveal>
            <p className="text-lg leading-relaxed text-[var(--ink-2)]">
              Triad Realty was founded in Dubai by three property consultants who believed UAE real estate deserved a quieter, sharper, more thoughtful kind of advisory. Today we work with investors from twenty-two countries — quietly, deliberately, and entirely on the side of the client.
            </p>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
              {WHY_TRIAD.map((w) => (
                <div key={w.v} className="border-l border-[var(--gold)] pl-4">
                  <div className="font-display text-3xl md:text-4xl">{w.k}</div>
                  <div className="overline opacity-60 mt-1">{w.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <div className="overline mb-6 text-[var(--muted)]">Our Milestones</div>
              <div className="space-y-4">
                {MILESTONES.map((m) => (
                  <div key={m.year} className="flex items-baseline gap-6 border-b border-[var(--line)] pb-3">
                    <div className="font-display text-2xl text-[var(--gold-deep)] w-20 tabular">{m.year}</div>
                    <div className="text-sm flex-1">{m.label}</div>
                  </div>
                ))}
              </div>
              <Link to="/about" className="btn-ghost mt-8" data-testid="about-view-more">View more <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* LAUNCHES */}
      <section className="section-pad bg-[var(--bg-alt)] relative" data-testid="home-launches">
        <div className="container-x">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div>
              <div className="overline text-[var(--gold-deep)]">Latest Launches</div>
              <h2 className="font-display text-4xl md:text-6xl mt-3 leading-none">
                The towers we're watching.
              </h2>
            </div>
            <Link to="/projects" className="btn-ghost" data-testid="launches-view-all">All Projects <ArrowRight size={14} /></Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-reveal>
            {projects.slice(0, 3).map((p, idx) => (
              <Link
                to={`/projects/${p.id}`}
                key={p.id}
                className="group block bg-white"
                data-testid={`launch-card-${p.id}`}
              >
                <div className="img-zoom aspect-[4/5] relative">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                  {p.isFeatured && (
                    <div className="absolute top-4 left-4 bg-[var(--ink)] text-[var(--gold)] overline px-3 py-1">
                      Hot Launch
                    </div>
                  )}
                </div>
                <div className="p-6 border-l border-r border-b border-[var(--line)]">
                  <div className="overline text-[var(--muted)]">{p.developer}</div>
                  <h3 className="font-display text-2xl mt-2 leading-tight">{p.title}</h3>
                  <p className="text-sm text-[var(--muted)] mt-1">{p.location}</p>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <div className="overline opacity-60">Starting from</div>
                      <div className="font-display text-2xl mt-1">{p.startingPrice}</div>
                    </div>
                    <ArrowUpRight className="group-hover:text-[var(--gold-deep)] transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDERS PHOTO */}
      <section className="bg-[var(--bg-alt)]" data-testid="home-founders-photo">
        <div className="container-x">
          <div className="w-full aspect-[21/9] bg-[var(--ink)] overflow-hidden relative" data-reveal>
            <img 
              src={homepageSettings.founders_image_url || DEFAULT_HOMEPAGE_SETTINGS.founders_image_url} 
              alt="Founders of Triad Realty" 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/80 to-transparent flex items-end p-8 md:p-12">
              <h2 className="font-display text-4xl md:text-5xl text-white">Three founders. One conviction.</h2>
            </div>
          </div>
        </div>
      </section>

      <PartnerDevelopers />


      {/* TEAM */}
      <section className="section-pad bg-[var(--ink)] text-white relative" data-testid="home-team">
        <div className="grain absolute inset-0" />
        <div className="container-x relative">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-14">
            <div>
              <div className="overline text-[var(--gold)]">Our Team</div>
              <h2 className="font-display text-4xl md:text-6xl mt-3 leading-none">The consultants behind every deal.</h2>
            </div>
          </div>

          {/* Team Group Photo Banner */}
          <div className="w-full aspect-[21/9] bg-white/5 overflow-hidden relative shadow-lg mb-12 img-zoom border border-white/10" data-reveal>
            <img 
              src="/group_photo.jpg" 
              alt="Triad Realty Team Group" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-90 group-hover:opacity-100" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" data-reveal>
            {team.filter((t) => t && t.name).map((t) => (
              <div key={t.id || t.name} className="group" data-testid={`team-${t.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="aspect-[3/4] img-zoom bg-[var(--surface-dark,#141414)] relative">
                  {t.photo ? (
                    <img src={t.photo} alt={t.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-white">
                      <span className="font-display text-6xl text-[var(--gold)]">
                        {t.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                     <Link to={`/team/${t.id}`} className="btn-gold !px-6 !py-3">View More</Link>
                  </div>
                </div>
                <h3 className="font-display text-2xl mt-5">{t.name}</h3>
                <p className="overline opacity-60 mt-1">{t.role || "Property Consultant"}</p>
                <div className="flex gap-3 mt-4 text-xs opacity-80">
                  <a href={`tel:${(t.phone || "").replace(/\s/g, "")}`} className="flex items-center gap-1 hover:text-[var(--gold)]"><Phone size={12} />Call</a>
                  <a href={`mailto:${t.email}`} className="flex items-center gap-1 hover:text-[var(--gold)]"><Mail size={12} />Email</a>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-14 border-t border-white/20 pt-10 flex justify-between items-center">
            <h3 className="font-display text-3xl">Meet the full team</h3>
            <Link to="/team" className="btn-ghost-light">View All Members <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section-pad bg-[var(--bg-alt)]" data-testid="home-reviews">
        <div className="container-x">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <div className="overline text-[var(--gold-deep)]">Client Testimonials</div>
              <h2 className="font-display text-4xl md:text-5xl mt-3 leading-tight">Trusted advice, clear outcomes.</h2>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={18} className="text-[var(--gold)] fill-[var(--gold)]" />
                  ))}
                </div>
                <div className="font-display text-2xl">4.9</div>
                <div className="text-xs text-[var(--muted)]">average client rating</div>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--line)]">
              {REVIEWS.slice(0, 4).map((r) => (
                <div key={r.name} className="bg-white p-8" data-testid={`review-${r.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Quote className="text-[var(--gold)]" size={20} />
                  <p className="font-display text-lg leading-snug mt-4">"{r.quote}"</p>
                  <div className="mt-6 pt-4 border-t border-[var(--line)]">
                    <div className="font-medium">{r.name}</div>
                    <div className="overline opacity-60 mt-1">{r.role} · {r.country}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad bg-white" data-testid="home-cta">
        <div className="container-x grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="overline text-[var(--gold-deep)]">Begin</div>
            <h2 className="font-display text-4xl md:text-6xl mt-3 leading-none">
              The portfolio you imagined is one conversation away.
            </h2>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Link to="/contact" className="btn-gold" data-testid="cta-book">Book a Consultation <ArrowRight size={14} /></Link>
            <a href={COMPANY.whatsapp} target="_blank" rel="noreferrer" className="btn-ghost">WhatsApp Us <ArrowUpRight size={14} /></a>
          </div>
        </div>
      </section>
    </>
  );
}
