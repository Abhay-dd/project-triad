import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Phone, Mail, Instagram, Linkedin, ArrowLeft, Youtube } from "lucide-react";
import axios from "axios";

import { API_URL as API } from "../config";

function extractYtId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
  );
  return match ? match[1] : null;
}

export default function TeamMember() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/team/${id}`)
      .then((r) => {
        setMember(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="overline text-[var(--muted)] animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="font-display text-4xl">Team member not found.</h1>
        <Link to="/team" className="btn-ghost">
          Back to Team
        </Link>
      </div>
    );
  }

  const ytId1 = extractYtId(member.videoUrl);
  const ytId2 = extractYtId(member.videoUrl2);
  const hasVideos = ytId1 || ytId2;

  return (
    <>
      {/* ── PROFILE HERO ── */}
      <section className="pt-32 pb-20 bg-[var(--bg-alt)]">
        <div className="container-x px-5 lg:px-12">
          <Link
            to="/team"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-[var(--muted)] hover:text-[var(--ink)] transition-colors mb-10"
          >
            <ArrowLeft size={16} /> Back to Team
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            {/* Photo */}
            <div className="lg:col-span-4">
              <div className="w-full aspect-[3/4] bg-[var(--line)] img-zoom">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Contact strip under photo */}
              <div className="mt-6 space-y-3">
                {member.phone && (
                  <a
                    href={`tel:${member.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 text-sm hover:text-[var(--gold-deep)] transition-colors group"
                  >
                    <span className="w-8 h-8 flex items-center justify-center border border-[var(--line)] group-hover:border-[var(--gold)] transition-colors">
                      <Phone size={14} />
                    </span>
                    {member.phone}
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-3 text-sm hover:text-[var(--gold-deep)] transition-colors group"
                  >
                    <span className="w-8 h-8 flex items-center justify-center border border-[var(--line)] group-hover:border-[var(--gold)] transition-colors">
                      <Mail size={14} />
                    </span>
                    {member.email}
                  </a>
                )}
                {member.instagram && (
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-sm hover:text-[var(--gold-deep)] transition-colors group"
                  >
                    <span className="w-8 h-8 flex items-center justify-center border border-[var(--line)] group-hover:border-[var(--gold)] transition-colors">
                      <Instagram size={14} />
                    </span>
                    Instagram
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-sm hover:text-[var(--gold-deep)] transition-colors group"
                  >
                    <span className="w-8 h-8 flex items-center justify-center border border-[var(--line)] group-hover:border-[var(--gold)] transition-colors">
                      <Linkedin size={14} />
                    </span>
                    LinkedIn
                  </a>
                )}
              </div>
            </div>

            {/* Bio & Details */}
            <div className="lg:col-span-8">
              <div className="overline text-[var(--gold-deep)]">{member.role}</div>
              <h1 className="font-display text-5xl md:text-7xl mt-4 leading-none">{member.name}</h1>

              {(member.expertise || member.focus) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 pt-8 border-t border-[var(--line)]">
                  {member.expertise && (
                    <div className="bg-white border border-[var(--line)] p-6">
                      <div className="overline text-[var(--gold-deep)] mb-2">Expertise</div>
                      <p className="text-[var(--ink-2)] leading-relaxed">{member.expertise}</p>
                    </div>
                  )}
                  {member.focus && (
                    <div className="bg-white border border-[var(--line)] p-6">
                      <div className="overline text-[var(--gold-deep)] mb-2">Focus</div>
                      <p className="text-[var(--ink-2)] leading-relaxed">{member.focus}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 text-lg leading-relaxed text-[var(--ink-2)]">
                {member.bio ? (
                  <p className="whitespace-pre-line">{member.bio}</p>
                ) : (
                  <p className="text-[var(--muted)] italic">No biography provided.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── YOUTUBE VIDEOS ── */}
      {hasVideos && (
        <section className="section-pad bg-white">
          <div className="container-x px-5 lg:px-12">
            <div className="flex items-center gap-3 mb-10">
              <Youtube size={20} className="text-[var(--gold-deep)]" />
              <div className="overline text-[var(--gold-deep)]">Featured Videos</div>
            </div>

            <div className={`grid gap-8 ${ytId1 && ytId2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {ytId1 && (
                <div className="space-y-3">
                  {ytId2 && (
                    <div className="overline text-[var(--muted)]">Video 1</div>
                  )}
                  <div className="w-full aspect-video bg-[var(--ink)] relative">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId1}`}
                      title={`${member.name} — video 1`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                </div>
              )}
              {ytId2 && (
                <div className="space-y-3">
                  {ytId1 && (
                    <div className="overline text-[var(--muted)]">Video 2</div>
                  )}
                  <div className="w-full aspect-video bg-[var(--ink)] relative">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId2}`}
                      title={`${member.name} — video 2`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
