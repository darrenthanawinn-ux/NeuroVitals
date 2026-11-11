import type { Status, Triage } from "@/lib/types";

export const statusStyles: Record<Status, { text: string; bg: string; border: string; bar: string; label: string }> = {
  normal: { text: "text-emerald-300", bg: "bg-emerald-400/10", border: "border-emerald-400/25", bar: "bg-emerald-400", label: "Within range" },
  watch: { text: "text-amber-300", bg: "bg-amber-400/10", border: "border-amber-400/25", bar: "bg-amber-400", label: "Watch" },
  flag: { text: "text-rose-300", bg: "bg-rose-400/10", border: "border-rose-400/25", bar: "bg-rose-400", label: "Flagged" },
};

export const triageStyles: Record<Triage, { text: string; bg: string; border: string; stroke: string; desc: string }> = {
  Routine: { text: "text-emerald-300", bg: "bg-emerald-400/10", border: "border-emerald-400/30", stroke: "#34d399", desc: "No urgent action indicated" },
  Priority: { text: "text-amber-300", bg: "bg-amber-400/10", border: "border-amber-400/30", stroke: "#fbbf24", desc: "Clinical review recommended soon" },
  Urgent: { text: "text-rose-300", bg: "bg-rose-400/10", border: "border-rose-400/30", stroke: "#fb7185", desc: "Prompt specialist evaluation advised" },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = statusStyles[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.text} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  );
}

export function TriageBadge({ triage }: { triage: Triage }) {
  const s = triageStyles[triage];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.text} ${s.bg} ${s.border}`}>
      {triage}
    </span>
  );
}
