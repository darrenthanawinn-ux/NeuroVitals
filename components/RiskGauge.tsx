"use client";

import { useEffect, useState } from "react";
import type { Triage } from "@/lib/types";
import { triageStyles } from "./StatusBadge";

export default function RiskGauge({ value, triage, size = 220 }: { value: number; triage: Triage; size?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const r = 80;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75; // 270 degree gauge
  const filled = (shown / 100) * arc;
  const color = triageStyles[triage].stroke;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`Composite risk ${value} percent`}>
        <g transform="rotate(135 100 100)">
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${arc} ${circ}`} />
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold tabular-nums tracking-tight">
          {Math.round(shown)}
          <span className="text-2xl text-slate-400">%</span>
        </span>
        <span className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">Composite risk</span>
      </div>
    </div>
  );
}
