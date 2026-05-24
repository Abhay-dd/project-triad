import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, ArrowUpRight } from "lucide-react";
import axios from "axios";

import { API_URL as API } from "../config";

export default function TeamList() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/team`)
      .then((r) => {
        setTeam(r.data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="pt-40 pb-20 section-pad bg-[var(--ink)] text-white" data-testid="team-hero">
        <div className="container-x">
          <div className="overline text-[var(--gold)]">Our Team</div>
          <h1 className="font-display text-5xl md:text-8xl leading-[0.95] mt-6 max-w-5xl">
            The consultants behind every <em className="text-[var(--gold)]">deal.</em>
          </h1>
          <p className="text-lg md:text-xl mt-8 max-w-2xl leading-relaxed text-white/80">
            A tight team of senior consultants who know every floor plan in our active list.
          </p>
        </div>
      </section>

      <section className="section-pad bg-white" data-testid="team-list">
        <div className="container-x">
          {loading ? (
            <div className="text-center py-20 opacity-50 uppercase tracking-widest text-sm">Loading team...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10" data-reveal>
              {team.map((t) => (
                <div key={t.id} className="group" data-testid={`about-team-${t.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="aspect-[3/4] img-zoom bg-[var(--bg-alt)] relative">
                    <img src={t.photo} alt={t.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                    <div className="absolute inset-0 bg-[var(--ink)]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                       <Link to={`/team/${t.id}`} className="btn-gold !px-6 !py-3 border-none">View Profile</Link>
                    </div>
                  </div>
                  <h3 className="font-display text-2xl mt-5">{t.name}</h3>
                  <div className="overline text-[var(--gold-deep)] mt-1">{t.role}</div>
                  {t.expertise && <p className="text-sm mt-3 text-[var(--ink-2)]"><strong className="font-medium">Expertise:</strong> {t.expertise}</p>}
                  {t.focus && <p className="text-sm text-[var(--ink-2)]"><strong className="font-medium">Focus:</strong> {t.focus}</p>}
                  
                  <div className="flex gap-3 mt-4 text-xs">
                    {t.phone && <a href={`tel:${t.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-[var(--gold-deep)]"><Phone size={12} />Call</a>}
                    {t.email && <a href={`mailto:${t.email}`} className="flex items-center gap-1.5 hover:text-[var(--gold-deep)]"><Mail size={12} />Email</a>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 border-t border-[var(--line)] pt-10 flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-2xl">Want to work alongside this team?</p>
            <Link to="/careers" className="btn-gold">View Open Positions <ArrowUpRight size={14} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
