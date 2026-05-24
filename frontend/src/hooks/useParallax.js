import { useEffect, useState, useRef, useCallback } from "react";

const MOBILE_MQ = "(max-width: 1023px)";
const MOTION_MQ = "(prefers-reduced-motion: reduce)";

/** Detect mobile / reduced-motion — use static layout when true. */
export function useParallaxCapability() {
  const [lite, setLite] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia(MOBILE_MQ).matches ||
      window.matchMedia(MOTION_MQ).matches
    );
  });

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_MQ);
    const motion = window.matchMedia(MOTION_MQ);
    const sync = () => setLite(mobile.matches || motion.matches);
    sync();
    mobile.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      mobile.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  return { lite };
}

/** Reveal children when they enter the viewport (one-shot). */
export function useParallaxReveal(enabled = true, options = {}) {
  const ref = useRef(null);
  const { threshold = 0.18, rootMargin = "0px 0px -6% 0px" } = options;

  useEffect(() => {
    if (!enabled || !ref.current) return undefined;
    const root = ref.current;
    const targets = root.querySelectorAll("[data-parallax-reveal]");
    if (!targets.length) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold, rootMargin }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [enabled, threshold, rootMargin]);

  return ref;
}

/**
 * Sets --parallax-p (0–1) on [data-parallax-section] nodes inside root.
 * Single rAF-throttled scroll listener, scoped to this showcase only.
 */
export function useParallaxScroll(rootRef, enabled = true) {
  useEffect(() => {
    if (!enabled || !rootRef.current) return undefined;

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const root = rootRef.current;
      if (!root) return;
      const vh = window.innerHeight;
      root.querySelectorAll("[data-parallax-section]").forEach((section) => {
        const rect = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - vh;
        const traveled = Math.min(
          scrollable,
          Math.max(0, -rect.top)
        );
        const p = scrollable > 0 ? traveled / scrollable : 0;
        section.style.setProperty("--parallax-p", p.toFixed(4));
      });
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled, rootRef]);
}

/** Optional: read scroll progress for a single element (0–1). */
export function useSectionProgress(ref, enabled = true) {
  const [progress, setProgress] = useState(0);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollable = el.offsetHeight - vh;
    const traveled = Math.min(scrollable, Math.max(0, -rect.top));
    setProgress(scrollable > 0 ? traveled / scrollable : 0);
  }, [ref, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    let rafId = 0;
    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(() => {
        rafId = 0;
        measure();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled, measure]);

  return progress;
}
