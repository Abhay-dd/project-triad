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
      className={`fixed inset-0 z-[200] bg-[var(--ink)] flex flex-col justify-between p-8 md:p-14 transition-all duration-[1100ms] ease-[cubic-bezier(0.86,0,0.07,1)] ${
        stage === "exit" ? "translate-y-[-100%]" : ""
      }`}
    >
      <div className="grain absolute inset-0 opacity-40" />

      <div className="relative flex justify-between items-start text-[var(--gold)]">
        <div className="overline">Triad Realty · UAE</div>
        <div className="overline tabular">{String(pct).padStart(3, "0")} / 100</div>
      </div>

      <div className="relative">
        <div className="overflow-hidden">
          <div className="flex items-center gap-6 intro-rise">
            <img
              src="/triad_logo.jpeg"
              alt="Triad Realty"
              className="h-[18vw] md:h-[12vw] max-h-64 w-auto object-contain"
            />
            <div>
              <div className="font-display text-[10vw] md:text-[7vw] leading-[0.9] text-white">TRIAD</div>
              <div className="font-display text-[10vw] md:text-[7vw] leading-[0.9] text-[var(--gold)] italic">REALTY</div>
            </div>
          </div>
        </div>
        <div className="mt-6 overflow-hidden">
          <div className="overline text-white/60 intro-rise-2">An address you will be known for.</div>
        </div>
      </div>

      <div className="relative">
        <div className="h-[1px] bg-white/15 w-full overflow-hidden">
          <div
            className="h-full bg-[var(--gold)] transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-4 text-[10px] uppercase tracking-[0.32em] text-white/50">
          <span>Dubai</span>
          <span>Sharjah</span>
          <span>Abu Dhabi</span>
        </div>
      </div>
    </div>
  );
}
