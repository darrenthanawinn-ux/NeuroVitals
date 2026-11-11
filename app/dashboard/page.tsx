"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ChevronRight, ClipboardList, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PrivacyBanner from "@/components/PrivacyBanner";
import { TriageBadge } from "@/components/StatusBadge";
import { clearAll, deleteReport, loadReports, saveReport, seedDemoIfEmpty } from "@/lib/storage";
import { makeDemoReport } from "@/lib/demo";
import type { Profile, Report } from "@/lib/types";

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => setReports(loadReports()), []);

  useEffect(() => {
    seedDemoIfEmpty(() => makeDemoReport("mild"));
    refresh();
    setReady(true);
  }, [refresh]);

  const addDemo = (p: Profile) => {
    const names: Record<Profile, string> = { typical: "Alex Morgan", mild: "Priya Nair", elevated: "Robert Hale" };
    const ages: Record<Profile, number> = { typical: 34, mild: 58, elevated: 72 };
    const r = makeDemoReport(p, names[p], ages[p]);
    r.id = `demo-${p}-${Date.now().toString(36)}`;
    r.patient.sessionId = r.id;
    saveReport(r);
    refresh();
  };

  const avg = reports.length ? Math.round(reports.reduce((a, r) => a + r.overallRisk, 0) / reports.length) : 0;
  const urgent = reports.filter((r) => r.triage === "Urgent").length;
  const trend = [...reports]
    .reverse()
    .map((r, i) => ({ n: i + 1, label: r.patient.name, Risk: r.overallRisk }));

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clinic dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Screening history stored locally in this browser.</p>
        </div>
        <Link href="/screening" className="btn-primary">
          <Plus className="h-4 w-4" /> New screening
        </Link>
      </div>

      <PrivacyBanner />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Users, l: "Screenings", v: String(reports.length) },
          { icon: Activity, l: "Average composite risk", v: `${avg}%` },
          { icon: ClipboardList, l: "Urgent triage cases", v: String(urgent) },
        ].map(({ icon: Icon, l, v }) => (
          <div key={l} className="glass flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums">{v}</div>
              <div className="text-xs text-slate-400">{l}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass p-5">
          <h2 className="mb-1 text-sm font-semibold">Risk across recent screenings</h2>
          <p className="mb-3 text-xs text-slate-500">Oldest to newest</p>
          <div className="h-60">
            {ready && trend.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: -15, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="n" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, fontSize: 12 }}
                    labelFormatter={(_, p) => (p && p[0] ? String((p[0].payload as { label: string }).label) : "")}
                  />
                  <Area type="monotone" dataKey="Risk" stroke="#22d3ee" strokeWidth={2} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-cyan-300" /> Demo cases
          </h2>
          <p className="mb-4 text-xs text-slate-500">Instantly generate a report with a chosen telemetry profile.</p>
          <div className="space-y-2.5">
            {(
              [
                ["typical", "Typical baseline"],
                ["mild", "Mild deviation"],
                ["elevated", "Elevated deviation"],
              ] as [Profile, string][]
            ).map(([p, label]) => (
              <button key={p} onClick={() => addDemo(p)} className="btn-ghost w-full !justify-between">
                {label}
                <Plus className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold">Recent reports</h2>
          {reports.length > 0 && (
            <button
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-300"
              onClick={() => {
                if (window.confirm("Erase all locally stored reports on this device?")) {
                  clearAll();
                  refresh();
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Erase all data
            </button>
          )}
        </div>
        {reports.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">No reports yet. Start a screening or add a demo case.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center gap-4 px-5 py-4">
                <Link href={`/report/${encodeURIComponent(r.id)}`} className="flex flex-1 items-center gap-4 hover:opacity-90">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold tabular-nums">{r.overallRisk}%</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.patient.name}</div>
                    <div className="truncate text-xs text-slate-500">
                      {r.patient.age}y · {new Date(r.createdAt).toLocaleString()} · {r.id}
                    </div>
                  </div>
                  <TriageBadge triage={r.triage} />
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Link>
                <button
                  aria-label={`Delete report ${r.id}`}
                  className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-rose-300"
                  onClick={() => {
                    deleteReport(r.id);
                    refresh();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
