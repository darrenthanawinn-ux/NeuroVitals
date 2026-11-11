"use client";

import { useState } from "react";
import { Camera, CameraOff, ChevronRight, Info } from "lucide-react";
import type { PatientMeta, Profile } from "@/lib/types";

const profiles: { id: Profile; title: string; desc: string }[] = [
  { id: "typical", title: "Typical baseline", desc: "Healthy-range telemetry" },
  { id: "mild", title: "Mild deviation", desc: "Borderline biomarkers" },
  { id: "elevated", title: "Elevated deviation", desc: "Multiple abnormal biomarkers" },
];

export default function ConsentStep({ onSubmit }: { onSubmit: (m: PatientMeta) => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("Prefer not to say");
  const [concern, setConcern] = useState("");
  const [profile, setProfile] = useState<Profile>("mild");
  const [useCamera, setUseCamera] = useState(false);
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const [touched, setTouched] = useState(false);

  const ageNum = Number(age);
  const ageOk = Number.isFinite(ageNum) && ageNum >= 18 && ageNum <= 110;
  const valid = name.trim().length > 0 && ageOk && c1 && c2 && c3;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onSubmit({
      sessionId: `NV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1296).toString(36).toUpperCase()}`,
      name: name.trim(),
      age: ageNum,
      sex,
      concern: concern.trim(),
      profile,
      useCamera,
      consentedAt: new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">Patient name or alias</label>
          <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. J. Rivera" autoComplete="off" />
          {touched && !name.trim() && <p className="mt-1 text-xs text-rose-300">Required</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="age">Age</label>
          <input id="age" className="field" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Adults 18+" />
          {touched && !ageOk && <p className="mt-1 text-xs text-rose-300">Enter an age between 18 and 110</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="sex">Sex at birth</label>
          <select id="sex" className="field" value={sex} onChange={(e) => setSex(e.target.value)}>
            {["Female", "Male", "Intersex", "Prefer not to say"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="concern">Presenting concern (optional)</label>
          <input id="concern" className="field" value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="e.g. hand tremor, slurred speech" />
        </div>
      </div>

      <div>
        <span className="field-label">Simulated patient telemetry profile</span>
        <div className="grid gap-3 sm:grid-cols-3">
          {profiles.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setProfile(p.id)}
              className={`rounded-xl border p-4 text-left transition ${
                profile === p.id ? "border-cyan-400/60 bg-cyan-400/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
              aria-pressed={profile === p.id}
            >
              <div className="text-sm font-medium">{p.title}</div>
              <div className="mt-0.5 text-xs text-slate-400">{p.desc}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Hackathon demo mode: biomarkers are synthesised from the chosen profile so every outcome can be demonstrated on stage.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          {useCamera ? <Camera className="h-5 w-5 text-cyan-300" /> : <CameraOff className="h-5 w-5 text-slate-500" />}
          <div>
            <div className="text-sm font-medium">Show live webcam preview</div>
            <div className="text-xs text-slate-400">Optional. Frames stay on-device and are never recorded or uploaded.</div>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={useCamera}
          onClick={() => setUseCamera((v) => !v)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${useCamera ? "bg-cyan-400" : "bg-white/15"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${useCamera ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      <fieldset className="space-y-3">
        <legend className="field-label">Consent confirmation</legend>
        {[
          { v: c1, set: setC1, t: "I consent to a short facial motor test and vocal biomarker test for screening purposes." },
          { v: c2, set: setC2, t: "I understand processing happens locally in my browser and results are stored only on this device." },
          { v: c3, set: setC3, t: "I understand this is a screening aid, not a diagnosis, and does not replace a clinician. In an emergency I will call local emergency services." },
        ].map((c, i) => (
          <label key={i} className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
            <input type="checkbox" checked={c.v} onChange={(e) => c.set(e.target.checked)} className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 accent-cyan-400" />
            <span>{c.t}</span>
          </label>
        ))}
        {touched && !(c1 && c2 && c3) && <p className="text-xs text-rose-300">All three confirmations are required to proceed.</p>}
      </fieldset>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          Continue to facial motor test <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
