import { Link } from "react-router-dom";
import { Instagram, Youtube, Linkedin, Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { COMPANY, NAV } from "../data";

const VIDEOS = [
  { label: "Dubai Marina Tour", href: COMPANY.youtube },
  { label: "Palm Jumeirah Walkthrough", href: COMPANY.youtube },
  { label: "Aljada Family Series", href: COMPANY.youtube },
  { label: "Market Update — Q4", href: COMPANY.instagram },
  { label: "Founder Conversation", href: COMPANY.instagram },
];

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="bg-[var(--ink)] text-white relative overflow-hidden">
      <div className="grain absolute inset-0" />
      <div className="container-x relative section-pad pt-24 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <img
                src="/triad_logo.jpeg"
                alt="Triad Realty Logo"
                className="h-14 w-auto object-contain"
              />
              <div>
                <div className="font-display text-2xl">TRIAD REALTY</div>
                <div className="overline opacity-60">UAE · Investment Consultants</div>
              </div>
            </div>
            <p className="font-display text-3xl md:text-4xl leading-tight mt-10 max-w-md">
              Property as a craft. Investment as a relationship.
            </p>
            <div className="mt-10 space-y-3 text-sm opacity-80">
              <div className="flex items-start gap-3"><MapPin size={16} className="mt-1 text-[var(--gold)]" /><span>{COMPANY.address}</span></div>
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 link-gold text-white" data-testid="footer-phone"><Phone size={16} className="text-[var(--gold)]" />{COMPANY.phone}</a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-3 link-gold text-white" data-testid="footer-email"><Mail size={16} className="text-[var(--gold)]" />{COMPANY.email}</a>
            </div>
            <div className="mt-8 flex gap-4">
              <a href={COMPANY.instagram} target="_blank" rel="noreferrer" className="w-11 h-11 border border-white/30 flex items-center justify-center hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all" data-testid="footer-instagram"><Instagram size={16} /></a>
              <a href={COMPANY.youtube} target="_blank" rel="noreferrer" className="w-11 h-11 border border-white/30 flex items-center justify-center hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all" data-testid="footer-youtube"><Youtube size={16} /></a>
              <a href={COMPANY.linkedin} target="_blank" rel="noreferrer" className="w-11 h-11 border border-white/30 flex items-center justify-center hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all" data-testid="footer-linkedin"><Linkedin size={16} /></a>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="overline opacity-50 mb-5">Quick Links</div>
            <ul className="space-y-3">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="text-sm opacity-85 hover:text-[var(--gold)] transition-colors" data-testid={`footer-link-${n.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="overline opacity-50 mb-5">Featured Videos</div>
            <ul className="space-y-3">
              {VIDEOS.map((v, i) => (
                <li key={i}>
                  <a href={v.href} target="_blank" rel="noreferrer" className="group flex items-center justify-between border-b border-white/10 pb-3 hover:border-[var(--gold)] transition-colors" data-testid={`footer-video-${i}`}>
                    <span className="text-sm opacity-90 group-hover:text-[var(--gold)] transition-colors">{v.label}</span>
                    <ArrowUpRight size={16} className="opacity-50 group-hover:opacity-100 group-hover:text-[var(--gold)] transition-colors" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row gap-3 justify-between text-xs opacity-50">
          <div>© {new Date().getFullYear()} Triad Realty LLC. All rights reserved.</div>
          <div className="tracking-[0.22em] uppercase">RERA Registered · Dubai Land Department</div>
        </div>
      </div>
    </footer>
  );
}
