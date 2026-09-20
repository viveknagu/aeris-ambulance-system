import { useEffect, useState } from "react";

const BOOT_STEPS = [
  "Initialising emergency grid",
  "Linking 108 control room",
  "Calibrating GPS lifeline",
  "Ready for dispatch",
];

export function Splash({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const stepTimer = setInterval(() => setStep((s) => Math.min(s + 1, BOOT_STEPS.length - 1)), 420);
    const outTimer = setTimeout(() => setLeaving(true), 1750);
    const doneTimer = setTimeout(onDone, 2200);
    return () => {
      clearInterval(stepTimer);
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[var(--gov-navy)] transition-all duration-500 ${
        leaving ? "pointer-events-none scale-105 opacity-0" : "opacity-100"
      }`}
    >
      {/* radar sweep */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="radar-ring" />
        <span className="radar-ring [animation-delay:0.6s]" />
        <span className="radar-ring [animation-delay:1.2s]" />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <div className="siren-badge relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-[var(--gov-amber)]">
          <span className="text-4xl font-black tracking-tight text-[var(--gov-amber)]">108</span>
        </div>

        <div className="w-[min(520px,88vw)]">
          <svg viewBox="0 0 600 120" className="h-24 w-full" role="img" aria-label="ECG lifeline">
            <polyline
              className="ecg-line"
              fill="none"
              stroke="var(--gov-red)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="0,60 90,60 110,60 125,25 140,95 155,45 170,60 250,60 270,60 285,18 300,102 315,40 330,60 430,60 450,60 465,30 480,90 495,50 510,60 600,60"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-white sm:text-3xl">
            Arogya Kavacha
          </h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gov-amber)]">
            National Emergency Ambulance Dispatch
          </p>
        </div>

        <div className="h-5 text-sm font-medium text-white/70">{BOOT_STEPS[step]}…</div>

        <div className="h-1 w-56 overflow-hidden rounded-full bg-white/15">
          <div className="boot-bar h-full rounded-full bg-[var(--gov-red)]" />
        </div>
      </div>
    </div>
  );
}
