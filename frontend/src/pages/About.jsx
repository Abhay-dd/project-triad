import { useEffect, useState } from "react";
import { FOUNDERS, TEAM, MILESTONES } from "../data";
import { Phone, Mail, Instagram, Linkedin, ArrowUpRight, House, Building2, Trophy, Globe2, Play } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL as API } from "../config";

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


export default function About() {
  const [homepageSettings, setHomepageSettings] = useState(DEFAULT_HOMEPAGE_SETTINGS);

  useEffect(() => {
    axios.get(`${API}/settings/homepage`).then((res) => {
      if (res.data) {
        setHomepageSettings({ ...DEFAULT_HOMEPAGE_SETTINGS, ...res.data });
      }
    }).catch(() => {});
  }, []);

  const youtubeId = extractYouTubeId(homepageSettings.launch_video_url);
  const launchStats = [
    { value: homepageSettings.stat1_value, label: homepageSettings.stat1_label, icon: House },
    { value: homepageSettings.stat2_value, label: homepageSettings.stat2_label, icon: Building2 },
    { value: homepageSettings.stat3_value, label: homepageSettings.stat3_label, icon: Trophy },
    { value: homepageSettings.stat4_value, label: homepageSettings.stat4_label, icon: Globe2 },
  ];

  return (
    <>
      <section className="pt-40 pb-20 section-pad bg-white" data-testid="about-hero">
        <div className="container-x">
          <div className="overline text-[var(--gold-deep)]">About Triad</div>
          <h1 className="font-display text-5xl md:text-8xl leading-[0.95] mt-6 max-w-5xl">
            Property, practiced as a <em className="text-[var(--gold-deep)]">craft.</em>
          </h1>
          <p className="text-lg md:text-xl mt-8 max-w-2xl leading-relaxed text-[var(--ink-2)]">
            We're a Dubai-based consultancy that treats real estate the way a great gallery treats an artist's catalogue — with research, restraint, and the long view.
          </p>
        </div>
      </section>

      <section className="section-pad bg-[var(--bg-alt)]" data-testid="about-who">
        <div className="container-x grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="overline text-[var(--gold-deep)]">Who We Are</div>
            <h2 className="font-display text-4xl md:text-5xl mt-5 leading-tight">
              Three founders, one principle: the client first.
            </h2>
          </div>
          <div className="lg:col-span-7 text-lg leading-relaxed space-y-6 text-[var(--ink-2)]">
            <p>
              Triad Realty was founded in 2025 by three property consultants who had spent years inside the largest brokerages in the UAE — and quietly believed clients deserved something better. Less hard-selling. More analysis. More patience.
            </p>
            <p>
              We're a young firm with deep operator experience. Our curated portfolio is small by design: a handful of trusted developers, a research desk that authors its own market notes, and a tight team of senior consultants who know every floor plan in our active list.
            </p>
            <p>
              We are licensed by the Dubai Land Department, RERA registered, and proud to be one of the most referred consultancies in the UAE.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-20 bg-[var(--bg-alt)]" data-testid="about-group-photo">
        <div className="container-x">
          <div className="w-full aspect-[21/9] bg-[var(--ink)] overflow-hidden relative shadow-sm img-zoom">
            <img 
              src="/group_photo.jpg" 
              alt="Triad Realty Team Group" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
            />
          </div>
        </div>
      </section>

      <section className="section-pad bg-white" data-testid="about-journey">
        <div className="container-x">
          <div className="overline text-[var(--gold-deep)]">Our Journey</div>
          <h2 className="font-display text-4xl md:text-6xl mt-3 leading-none">A short timeline.</h2>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)]">
            {MILESTONES.map((m) => (
              <div key={m.year} className="bg-white p-10">
                <div className="font-display text-6xl text-[var(--gold-deep)] leading-none">{m.year}</div>
                <p className="text-base mt-6 max-w-xs leading-relaxed">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--ink)] text-white relative" data-testid="about-founders">
        <div className="grain absolute inset-0" />
        <div className="container-x relative">
          <div className="overline text-[var(--gold)]">The Founders</div>
          <h2 className="font-display text-4xl md:text-6xl mt-3 leading-none">Three. Triad.</h2>

          {/* Three Founders Image Banner */}
          <div className="w-full aspect-[21/9] bg-white/5 overflow-hidden relative shadow-lg mt-12 img-zoom border border-white/10">
            <img 
              src="/three_founders.jpg" 
              alt="Three Founders of Triad Realty" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 opacity-90 hover:opacity-100" 
            />
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10" data-reveal>
            {FOUNDERS.map((f) => (
              <div key={f.name} data-testid={`founder-${f.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="aspect-[3/4] img-zoom">
                  <img src={f.photo} alt={f.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                </div>
                <h3 className="font-display text-3xl mt-6">{f.name}</h3>
                <div className="overline opacity-70 mt-1">{f.role}</div>
                <p className="text-sm opacity-80 mt-4 leading-relaxed">{f.bio}</p>
                <div className="flex flex-wrap gap-4 mt-6 text-xs">
                  <a href={`tel:${f.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-[var(--gold)]"><Phone size={12} />{f.phone}</a>
                  <a href={`mailto:${f.email}`} className="flex items-center gap-1.5 hover:text-[var(--gold)]"><Mail size={12} />Email</a>
                </div>
                <div className="flex gap-3 mt-4">
                  <a href={f.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 border border-white/30 flex items-center justify-center hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all"><Instagram size={14} /></a>
                  <a href={f.linkedin} target="_blank" rel="noreferrer" className="w-9 h-9 border border-white/30 flex items-center justify-center hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all"><Linkedin size={14} /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST LAUNCH UPDATES */}
      <section className="section-pad bg-white latest-launch-updates" data-testid="about-launch-updates">
        <div className="container-x">
          <div className="text-center max-w-5xl mx-auto mb-12" data-reveal>
            <div className="overline text-[var(--gold-deep)]">Latest Launch Updates</div>
            <h2 className="font-display text-4xl md:text-6xl mt-5 leading-none">{homepageSettings.launch_title}</h2>
            <p className="text-lg leading-relaxed text-[var(--ink-2)] mt-6">
              {homepageSettings.launch_description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-5" data-reveal>
              {launchStats.map(({ value, label, icon: Icon }) => (
                <div key={`${value}-${label}`} className="bg-[var(--bg-alt)] border border-[var(--line)] p-7 text-center min-h-[190px] flex flex-col justify-center">
                  <Icon size={48} strokeWidth={1.4} className="mx-auto text-[var(--ink)]" />
                  <div className="font-display text-3xl mt-5 tabular">{value}</div>
                  <div className="text-sm text-[var(--muted)] mt-2">{label}</div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-7" data-reveal>
              <div className="aspect-video bg-[var(--ink)] relative overflow-hidden shadow-2xl shadow-black/10">
                {youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="Latest launch update video"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--ink)]">
                    <div className="w-20 h-20 border border-[var(--gold)] text-[var(--gold)] flex items-center justify-center">
                      <Play size={30} fill="currentColor" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-white" data-testid="about-team">
        <div className="container-x">
          <div className="overline text-[var(--gold-deep)]">The Team</div>
          <h2 className="font-display text-4xl md:text-6xl mt-3 leading-none">Senior consultants. Specialised desks.</h2>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10" data-reveal>
            {TEAM.map((t) => (
              <div key={t.name} className="group" data-testid={`about-team-${t.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="aspect-[3/4] img-zoom">
                  <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-display text-2xl mt-5">{t.name}</h3>
                <div className="overline opacity-60 mt-1">{t.role}</div>
                <p className="text-sm mt-3 text-[var(--ink-2)]"><strong className="font-medium">Expertise:</strong> {t.expertise}</p>
                <p className="text-sm text-[var(--ink-2)]"><strong className="font-medium">Focus:</strong> {t.focus}</p>
                <div className="flex gap-3 mt-4 text-xs">
                  <a href={`tel:${t.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-[var(--gold-deep)]"><Phone size={12} />Call</a>
                  <a href={`mailto:${t.email}`} className="flex items-center gap-1.5 hover:text-[var(--gold-deep)]"><Mail size={12} />Email</a>
                  <a href={t.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[var(--gold-deep)]"><Instagram size={12} /></a>
                  <a href={t.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[var(--gold-deep)]"><Linkedin size={12} /></a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 border-t border-[var(--line)] pt-10 flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-2xl">Want to work alongside this team?</p>
            <Link to="/careers" className="btn-gold">View Open Positions <ArrowUpRight size={14} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
