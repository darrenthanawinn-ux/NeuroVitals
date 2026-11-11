"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PrivacyBanner from "@/components/PrivacyBanner";
import Stepper from "@/components/Stepper";
import ConsentStep from "@/components/ConsentStep";
import FaceTest from "@/components/FaceTest";
import VoiceTest from "@/components/VoiceTest";
import ProcessingStep from "@/components/ProcessingStep";
import { buildReport } from "@/lib/analysis";
import { saveReport } from "@/lib/storage";
import type { FaceMetrics, PatientMeta, VoiceMetrics } from "@/lib/types";

const steps = ["Consent & details", "Facial motor test", "Vocal biomarker test", "Triage report"];

const headings = [
  { t: "Patient details & consent", d: "Confirm who is being screened and agree to local-only processing." },
  { t: "Facial motor test", d: "Real-time tracking of blink rate, pupil stability and facial symmetry." },
  { t: "Vocal biomarker test", d: "Read the passage aloud to capture cadence, pitch variability and pauses." },
  { t: "Generating report", d: "Fusing facial and vocal telemetry into a clinical triage summary." },
];

export default function ScreeningPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState<PatientMeta | null>(null);
  const [face, setFace] = useState<FaceMetrics | null>(null);
  const [voice, setVoice] = useState<VoiceMetrics | null>(null);

  const finish = () => {
    if (!meta || !face || !voice) return;
    const report = buildReport(meta, face, voice);
    saveReport(report);
    router.push(`/report/${report.id}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <Stepper steps={steps} current={step} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{headings[step].t}</h1>
        <p className="mt-1 text-sm text-slate-400">{headings[step].d}</p>
      </div>

      {step === 0 && <PrivacyBanner compact />}

      <div className="glass p-5 sm:p-7">
        {step === 0 && (
          <ConsentStep
            onSubmit={(m) => {
              setMeta(m);
              setStep(1);
            }}
          />
        )}
        {step === 1 && meta && (
          <FaceTest
            meta={meta}
            onComplete={(m) => {
              setFace(m);
              setStep(2);
            }}
          />
        )}
        {step === 2 && meta && (
          <VoiceTest
            meta={meta}
            onComplete={(m) => {
              setVoice(m);
              setStep(3);
            }}
          />
        )}
        {step === 3 && <ProcessingStep onDone={finish} />}
      </div>
    </div>
  );
}
