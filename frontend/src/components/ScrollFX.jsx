import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Adds .is-visible to elements with [data-reveal] when scrolled into view.
// Also drives a top scroll-progress bar using window scroll.
export default function ScrollFX() {
  const { pathname } = useLocation();

  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));

    const bar = document.getElementById("scroll-progress-bar");
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      if (bar) bar.style.width = `${pct}%`;
      document.body.classList.toggle("is-scrolling-down", h.scrollTop > 80);
      document.querySelectorAll("[data-parallax]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const speed = Number(el.getAttribute("data-parallax")) || 0.15;
        const offset = (r.top - window.innerHeight / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none">
      <div id="scroll-progress-bar" className="h-full bg-[var(--gold)] w-0 transition-[width] duration-100" />
    </div>
  );
}
