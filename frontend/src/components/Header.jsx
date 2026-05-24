import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NAV, COMPANY } from "../data";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl bg-white/85 border-b border-[var(--line)]"
          : "bg-black/70 xl:bg-transparent"
      }`}
    >
      <div className="container-x flex items-center justify-between px-5 lg:px-12 py-4">
        <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
          <img
            src="/triad_logo.jpeg"
            alt="Triad Realty Logo"
            className="h-12 w-auto object-contain"
          />
          <div className="leading-tight">
            <div className="font-display text-lg tracking-tight">TRIAD</div>
            <div className="overline text-[9px] -mt-0.5 opacity-60">REALTY · UAE</div>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-5 2xl:gap-7">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `text-[11px] uppercase tracking-[0.18em] whitespace-nowrap link-gold ${isActive ? "text-[var(--gold-deep)]" : ""
                }`
              }
              end={n.to === "/"}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden xl:flex items-center gap-4">
          <a
            href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
            className="text-[11px] tracking-[0.16em] uppercase whitespace-nowrap link-gold hidden 2xl:inline-block"
            data-testid="header-phone"
          >
            {COMPANY.phone}
          </a>
          <Link to="/contact" className="btn-gold" data-testid="header-cta">
            Book Consultation
          </Link>
        </div>

        <button
          className="xl:hidden p-2"
          aria-label="menu"
          onClick={() => setOpen((v) => !v)}
          data-testid="mobile-menu-toggle"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="xl:hidden bg-white border-t border-[var(--line)]" data-testid="mobile-menu">
          <div className="flex flex-col p-6 gap-4">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-[0.22em]"
                data-testid={`mobile-nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/contact" onClick={() => setOpen(false)} className="btn-gold mt-2">
              Book Consultation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
