import { Check } from "lucide-react";

export default function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                  done
                    ? "border-cyan-400 bg-cyan-400 text-slate-950"
                    : active
                    ? "border-cyan-400 bg-cyan-400/15 text-cyan-200"
                    : "border-white/15 text-slate-500"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden whitespace-nowrap text-sm sm:block ${active ? "text-white" : "text-slate-500"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={`h-px min-w-[16px] flex-1 ${done ? "bg-cyan-400/60" : "bg-white/10"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
