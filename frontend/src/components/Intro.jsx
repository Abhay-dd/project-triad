import { useEffect, useState } from "react";

export default function Intro() {
  const [stage, setStage] = useState("loading"); // loading | exit | done
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem("triad_intro")) {
      setStage("done");
      return;
    }
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + Math.random() * 9 + 4);
      setPct(Math.floor(p));
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(() => setStage("exit"), 350);
        setTimeout(() => {
          setStage("done");
          sessionStorage.setItem("triad_intro", "1");
        }, 1500);
      }
    }, 110);
    return () => clearInterval(tick);
  }, []);

  if (stage === "done") return null;

  return (
    <div
      data-testid="intro-screen"
      className={`fixed inset-0 z-[200] bg-[var(--ink)] flex items-center justify-center p-8 transition-all duration-[1100ms] ease-[cubic-bezier(0.86,0,0.07,1)] ${
        stage === "exit" ? "translate-y-[-100%]" : ""
      }`}
    >
      <div className="grain absolute inset-0 opacity-30 pointer-events-none" />

      <div className="relative flex flex-col items-center gap-6 text-center animate-fade-in">
        <div className="flex items-center gap-4 sm:gap-6">
          <img
            src="/triad_logo.jpeg"
            alt="Triad Realty Logo"
            className="h-16 sm:h-20 w-auto object-contain flex-shrink-0"
          />
          <div className="text-left">
            <div className="font-display text-4xl sm:text-5xl tracking-wide text-white leading-none">TRIAD</div>
            <div className="font-display text-4xl sm:text-5xl tracking-wide text-[var(--gold)] italic leading-none mt-1">REALTY</div>
          </div>
        </div>
      </div>
    </div>
  );
}
