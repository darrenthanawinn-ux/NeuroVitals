"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Download, Eye, FileText, Printer, ShieldCheck, Stethoscope, Waves, ScanFace } from "lucide-react";
import type { Report } from "@/lib/types";
import RiskGauge from "./RiskGauge";
import { StatusBadge, statusStyles, triageStyles } from "./StatusBadge";

const groupIcon = { Ocular: Eye, Facial: ScanFace, Vocal: Waves, Speech: FileText } as const;

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  fontSize: 12,
  color: "#e2e8f0",
};

export default function ReportView({ report }: { report: Report }) {
  const [showRaw, setShowRaw] = useState(false);
  const t = triageStyles[report.triage];

  const download = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurovitals-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const faceData = report.face.samples.map((s) => ({ t: s.t, Symmetry: +s.symmetry.toFixed(1), Pupil: +s.pupil.toFixed(3) }));
  const voiceData = report.voice.samples.map((s) => ({ t: s.t, Pitch: s.pitch ? +s.pitch.toFixed(1) : null, Level: +(s.amp * 100).toFixed(0) }));
  const radarData = report.domains.map((d) => ({ domain: d.label, Risk: d.risk }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-300">
            <Stethoscope className="h-4 w-4" /> AI Clinical Triage Report
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{report.patient.name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {report.patient.age}y · {report.patient.sex} · Session {report.id} · {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="no-print flex gap-3">
          <button className="btn-ghost" onClick={download}>
            <Download className="h-4 w-4" /> Export JSON
          </button>
          <button className="btn-primary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className={`grid gap-6 rounded-2xl border p-6 lg:grid-cols-[auto_1fr] ${t.border} ${t.bg}`}>
        <div className="flex justify-center">
          <RiskGauge value={report.overallRisk} triage={report.triage} />
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${t.text} ${t.border}`}>
              <AlertTriangle className="h-4 w-4" /> {report.triage} triage
            </span>
            <span className="text-sm text-slate-300">{t.desc}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Analytic confidence {report.confidence}%</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-200">{report.summary}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {(["normal", "watch", "flag"] as const).map((s) => (
              <div key={s} className="rounded-xl border border-white/10 bg-slate-950/40 py-3">
                <div className={`text-2xl font-semibold ${statusStyles[s].text}`}>{report.domains.filter((d) => d.status === s).length}</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">{statusStyles[s].label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Biometric cards */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Biometric breakdown</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {report.domains.map((d) => {
            const Icon = groupIcon[d.group];
            const s = statusStyles[d.status];
            return (
              <div key={d.key} className="glass p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
                    <Icon className="h-4 w-4" /> {d.group}
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <div className="mt-3 text-sm text-slate-300">{d.label}</div>
                <div className="mt-0.5 text-2xl font-semibold tabular-nums">{d.display}</div>
                <div className="text-xs text-slate-500">Reference {d.reference}</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${Math.max(4, d.risk)}%` }} />
                </div>
                <div className="mt-1 text-right text-[11px] text-slate-500">Domain risk {d.risk}%</div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{d.interpretation}</p>
              </div>
            ))}
          </div>
        </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <h3 className="mb-1 text-sm font-semibold">Domain risk profile</h3>
          <p className="mb-2 text-xs text-slate-500">Higher values indicate greater deviation from reference range.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="Risk" stroke={t.stroke} fill={t.stroke} fillOpacity={0.25} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass p-5">
          <h3 className="mb-1 text-sm font-semibold">Facial symmetry over time</h3>
          <p className="mb-2 text-xs text-slate-500">{report.face.blinkTimes.length} blinks in {report.face.durationSec}s · {report.face.asymmetryEvents} asymmetry event(s)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={faceData} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="symFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 11 }} unit="s" />
                <YAxis domain={[60, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="Symmetry" stroke="#2dd4bf" fill="url(#symFill)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass p-5 lg:col-span-2">
          <h3 className="mb-1 text-sm font-semibold">Vocal pitch contour and level</h3>
          <p className="mb-2 text-xs text-slate-500">Gaps in the pitch trace are pauses ({report.voice.pauses.length} detected).</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={voiceData} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 11 }} unit="s" />
                <YAxis yAxisId="p" domain={["auto", "auto"]} tick={{ fill: "#64748b", fontSize: 11 }} unit=" Hz" />
                <YAxis yAxisId="l" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line yAxisId="p" type="monotone" dataKey="Pitch" stroke="#a78bfa" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
                <Line yAxisId="l" type="monotone" dataKey="Level" stroke="#22d3ee" strokeWidth={1} dot={false} strokeOpacity={0.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Findings & follow-ups */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <h3 className="mb-3 text-sm font-semibold">Key findings</h3>
          <ul className="space-y-2.5 text-sm text-slate-300">
            {report.findings.map((f, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass p-5">
          <h3 className="mb-3 text-sm font-semibold">Recommended clinical follow-ups</h3>
          <ol className="space-y-2.5 text-sm text-slate-300">
            {report.followUps.map((f, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-[11px] font-semibold text-cyan-200">{i + 1}</span>
                <span>{f}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Raw telemetry */}
      <section className="glass p-5">
        <button className="no-print flex w-full items-center justify-between text-left text-sm font-semibold" onClick={() => setShowRaw((v) => !v)}>
          Raw telemetry summary
          <span className="text-xs font-normal text-slate-400">{showRaw ? "Hide" : "Show"}</span>
        </button>
        <div className={`${showRaw ? "block" : "hidden"} print:block`}>
          <div className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
            {[
              { title: "Facial motor", rows: [["Blink rate", `${report.face.blinkRate}/min`], ["Blinks", report.face.blinkTimes.length], ["Pupil stability", `${report.face.pupilStability}%`], ["Mean symmetry", `${report.face.symmetry}%`], ["Asymmetry events", report.face.asymmetryEvents], ["Duration", `${report.face.durationSec}s`]] },
              { title: "Vocal biomarkers", rows: [["Mean pitch", `${report.voice.pitchMean} Hz`], ["Pitch variability", `${report.voice.pitchVariability} st`], ["Tremor", report.voice.tremorHz ? `${report.voice.tremorHz} Hz @ ${report.voice.tremorAmplitude}%` : "none"], ["Pause ratio", `${report.voice.pauseRatio}%`], ["Mean pause", `${report.voice.meanPauseMs} ms`], ["Speech rate", `${report.voice.speechRate} syl/s`], ["Mic captured", report.voice.micCaptured ? "yes" : "simulated"]] },
            ].map((g) => (
              <div key={g.title}>
                <div className="mb-2 font-medium text-slate-300">{g.title}</div>
                <dl className="divide-y divide-white/5 rounded-lg border border-white/10">
                  {g.rows.map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between px-3 py-1.5">
                      <dt className="text-slate-400">{k}</dt>
                      <dd className="tabular-nums text-slate-200">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-xs leading-relaxed text-slate-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        <p>
          Generated locally on-device; no data was transmitted. This report is produced by a research prototype using simulated multimodal telemetry and
          is intended as a decision-support aid for a licensed clinician. It is not a diagnosis, is not a regulated medical device, and must not be used
          to delay care. If you or someone else has sudden facial droop, arm weakness, speech difficulty, severe headache or confusion, call emergency
          services immediately.
        </p>
      </div>
    </div>
  );
}
