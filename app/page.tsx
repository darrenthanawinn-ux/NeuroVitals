import Link from "next/link";
import { Activity, ArrowRight, Brain, CheckCircle2, FileText, Lock, Mic, ScanFace, Stethoscope } from "lucide-react";
import PrivacyBanner from "@/components/PrivacyBanner";

const features = [
  {
    icon: ScanFace,
    title: "Facial motor tracking",
    body: "Blink kinetics, pupil stability and left/right facial symmetry tracked frame by frame on a live canvas.",
  },
  {
    icon: Mic,
    title: "Vocal biomarker analysis",
    body: "Pitch variability, 4-7 Hz tremor band, speech rate and pause structure captured from a short reading task.",
  },
  {
    icon: FileText,
    title: "Physician-ready triage",
    body: "Multimodal fusion into a composite risk score, domain cards, key findings and recommended follow-ups.",
  },
];

const steps = [
  { n: "01", t: "Consent & details", d: "Confirm patient information and local-only processing." },
  { n: "02", t: "Facial motor test", d: "20 seconds of simulated face and eye tracking." },
  { n: "03", t: "Vocal test", d: "15 seconds reading a short passage aloud." },
  { n: "04", t: "Triage report", d: "Instant structured summary, printable as PDF." },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Activity className="h-3.5 w-3.5" /> DSH Hacks V2 · AI x Healthcare
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Neurological screening
              <span className="block bg-gradient-to-r from-cyan-300 via-teal-300 to-violet-300 bg-clip-text text-transparent">in under two minutes.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              NeuroVitals AI combines facial motor tracking and vocal biomarker analysis to triage cognitive and neurological risk, entirely on the patient&apos;s own device.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/screening" className="btn-primary">
                Start screening <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="btn-ghost">
                View dashboard
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              {["No account required", "No data uploaded", "Printable physician report"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-md animate-float">
            <div className="glass relative aspect-square overflow-hidden p-6">
              <svg viewBox="0 0 300 300" className="h-full w-full" aria-hidden>
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <ellipse cx="150" cy="150" rx="86" ry="112" fill="url(#hg)" stroke="#22d3ee" strokeOpacity="0.6" />
                <line x1="150" y1="22" x2="150" y2="278" stroke="#94a3b8" strokeOpacity="0.4" strokeDasharray="4 6" />
                <ellipse cx="118" cy="132" rx="20" ry="10" fill="#e2e8f0" />
                <ellipse cx="182" cy="132" rx="20" ry="10" fill="#e2e8f0" />
                <circle cx="118" cy="132" r="6" fill="#0f172a" />
                <circle cx="182" cy="132" r="6" fill="#0f172a" />
                <path d="M122 205 Q150 218 178 205" stroke="#e2e8f0" strokeOpacity="0.7" strokeWidth="2" fill="none" />
                {Array.from({ length: 17 }).map((_, i) => {
                  const a = Math.PI * (0.12 + (i / 16) * 0.76);
                  return <circle key={i} cx={150 + Math.cos(a) * 80} cy={160 + Math.sin(a) * 104} r="2.4" fill="#2dd4bf" />;
                })}
              </svg>
              <div className="absolute inset-x-6 top-6 h-14 animate-scan bg-gradient-to-b from-transparent to-cyan-400/30" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg bg-slate-950/70 px-3 py-2 text-[11px] text-slate-300">
                <span>SYM 97.4%</span>
                <span>BLINK 16/min</span>
                <span className="text-emerald-300">STABLE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass p-6 transition hover:bg-white/[0.07]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-white/10 p-5">
              <span className="text-xs font-semibold tracking-widest text-cyan-300">{s.n}</span>
              <h3 className="mt-2 font-medium">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <PrivacyBanner />
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="glass flex flex-col items-center gap-5 px-6 py-12 text-center">
          <div className="flex items-center gap-2 text-cyan-300">
            <Brain className="h-5 w-5" /> <Stethoscope className="h-5 w-5" /> <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Run a demo screening now</h2>
          <p className="max-w-xl text-sm text-slate-400">
            Pick a typical, mild or elevated telemetry profile and see the full pipeline from consent to physician-ready report.
          </p>
          <Link href="/screening" className="btn-primary">
            Start screening <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
