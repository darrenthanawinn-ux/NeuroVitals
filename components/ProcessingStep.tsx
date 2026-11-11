"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const stages = [
  "Normalising facial landmark telemetry",
  "Computing blink kinetics and pupil variance",
  "Extracting vocal pitch, tremor band (4-7 Hz) and pause structure",
  "Cross-referencing age-adjusted reference ranges",
  "Fusing multimodal features into composite risk",
  "Drafting physician-ready triage summary",
];

export default function ProcessingStep({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (idx >= stages.length) {
      const t = setTimeout(() => doneRef.current(), 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx((i) => i + 1), 650);
    return () => clearTimeout(t);
  }, [idx]);

  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold">Analysing telemetry</h2>
        <p className="mt-1 text-sm text-slate-400">Running entirely in your browser. Nothing leaves this device.</p>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-[width] duration-500" style={{ width: `${(Math.min(idx, stages.length) / stages.length) * 100}%` }} />
      </div>
      <ul className="space-y-3">
        {stages.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 text-sm transition ${i <= idx ? "text-slate-200" : "text-slate-600"}`}>
            {i < idx ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : i === idx ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-300" />
            ) : (
              <span className="h-4 w-4 shrink-0 rounded-full border border-white/15" />
            )}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
