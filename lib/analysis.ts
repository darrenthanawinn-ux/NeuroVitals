import type {
  DomainScore,
  FaceMetrics,
  PatientMeta,
  Report,
  Status,
  Triage,
  VoiceMetrics,
} from "./types";
import { clamp } from "./simulation";

const statusOf = (risk: number): Status => (risk >= 60 ? "flag" : risk >= 30 ? "watch" : "normal");

/** Maps value -> risk by distance outside a healthy band. */
function bandRisk(v: number, lo: number, hi: number, scale: number) {
  if (v >= lo && v <= hi) return 5;
  const d = v < lo ? lo - v : v - hi;
  return clamp(5 + (d / scale) * 95, 0, 100);
}

export function buildReport(patient: PatientMeta, face: FaceMetrics, voice: VoiceMetrics): Report {
  const domains: DomainScore[] = [];

  const blinkRisk = bandRisk(face.blinkRate, 12, 22, 10);
  domains.push({
    key: "blink",
    label: "Blink rate",
    group: "Ocular",
    display: `${face.blinkRate} /min`,
    reference: "12-22 /min",
    risk: Math.round(blinkRisk),
    status: statusOf(blinkRisk),
    weight: 1,
    interpretation:
      face.blinkRate < 12
        ? "Reduced spontaneous blinking, a pattern associated with hypomimia and reduced dopaminergic tone."
        : face.blinkRate > 22
        ? "Elevated blink frequency; consider fatigue, ocular irritation or anxiety."
        : "Spontaneous blink rate within expected range.",
  });

  const pupilRisk = clamp((100 - face.pupilStability) * 1.6, 0, 100);
  domains.push({
    key: "pupil",
    label: "Pupil stability",
    group: "Ocular",
    display: `${face.pupilStability}%`,
    reference: "> 85%",
    risk: Math.round(pupilRisk),
    status: statusOf(pupilRisk),
    weight: 1,
    interpretation:
      pupilRisk >= 30
        ? "Increased pupillary diameter fluctuation (hippus-like) under constant illumination."
        : "Pupil diameter stable under constant illumination.",
  });

  const symRisk = clamp((96 - face.symmetry) * 3.2 + face.asymmetryEvents * 4, 0, 100);
  domains.push({
    key: "symmetry",
    label: "Facial symmetry",
    group: "Facial",
    display: `${face.symmetry}%`,
    reference: "> 92%",
    risk: Math.round(symRisk),
    status: statusOf(symRisk),
    weight: 1.4,
    interpretation:
      symRisk >= 60
        ? `Persistent lateral asymmetry with ${face.asymmetryEvents} transient asymmetry event(s); warrants focal-deficit assessment.`
        : symRisk >= 30
        ? "Mild lateral asymmetry detected; correlate with clinical examination."
        : "Bilateral facial movement symmetric within tolerance.",
  });

  const tremorRisk = voice.tremorHz
    ? clamp(25 + voice.tremorAmplitude * 18, 0, 100)
    : clamp(voice.tremorAmplitude * 12, 0, 20);
  domains.push({
    key: "tremor",
    label: "Vocal tremor",
    group: "Vocal",
    display: voice.tremorHz ? `${voice.tremorHz} Hz / ${voice.tremorAmplitude}%` : "None detected",
    reference: "< 1% modulation",
    risk: Math.round(tremorRisk),
    status: statusOf(tremorRisk),
    weight: 1.5,
    interpretation: voice.tremorHz
      ? `Periodic pitch modulation near ${voice.tremorHz} Hz, within the 4-7 Hz range seen in essential and parkinsonian voice tremor.`
      : "No periodic pitch modulation in the 4-7 Hz tremor band.",
  });

  const varRisk = clamp((2.2 - voice.pitchVariability) * 55, 0, 100);
  domains.push({
    key: "pitchvar",
    label: "Pitch variability",
    group: "Vocal",
    display: `${voice.pitchVariability} st`,
    reference: "> 2.0 st",
    risk: Math.round(varRisk),
    status: statusOf(varRisk),
    weight: 1.1,
    interpretation:
      varRisk >= 30
        ? "Flattened prosody (monopitch) consistent with reduced intonation range."
        : "Normal intonation range across the reading passage.",
  });

  const pauseRisk = bandRisk(voice.pauseRatio, 8, 24, 20);
  domains.push({
    key: "pause",
    label: "Speech pauses",
    group: "Speech",
    display: `${voice.pauseRatio}% (${voice.meanPauseMs} ms avg)`,
    reference: "8-24%",
    risk: Math.round(pauseRisk),
    status: statusOf(pauseRisk),
    weight: 1.2,
    interpretation:
      pauseRisk >= 30
        ? "Prolonged and frequent inter-word pauses suggest word-finding difficulty or bradyphrenia."
        : "Pause structure typical for connected speech.",
  });

  const rateRisk = bandRisk(voice.speechRate, 3.8, 5.6, 2.2);
  domains.push({
    key: "rate",
    label: "Speech rate",
    group: "Speech",
    display: `${voice.speechRate} syl/s`,
    reference: "3.8-5.6 syl/s",
    risk: Math.round(rateRisk),
    status: statusOf(rateRisk),
    weight: 0.9,
    interpretation:
      rateRisk >= 30
        ? "Slowed articulation rate compared with age-typical norms."
        : "Articulation rate within expected range.",
  });

  const totalW = domains.reduce((a, d) => a + d.weight, 0);
  const weighted = domains.reduce((a, d) => a + d.risk * d.weight, 0) / totalW;
  const maxRisk = Math.max(...domains.map((d) => d.risk));
  const ageAdj = patient.age >= 65 ? 3 : 0;
  const overallRisk = Math.round(clamp(weighted * 0.75 + maxRisk * 0.25 + ageAdj, 1, 99));

  const flagged = domains.filter((d) => d.status === "flag");
  const watched = domains.filter((d) => d.status === "watch");
  const triage: Triage = overallRisk >= 60 || flagged.length >= 2 ? "Urgent" : overallRisk >= 30 || flagged.length === 1 ? "Priority" : "Routine";

  const confidence = Math.round(
    clamp(
      72 + Math.min(face.durationSec, 15) * 0.7 + Math.min(voice.durationSec, 15) * 0.7 + (voice.micCaptured ? 4 : 0) + (patient.useCamera ? 3 : 0),
      50,
      96
    )
  );

  const findings: string[] = [];
  flagged.forEach((d) => findings.push(`${d.label}: ${d.display} (ref ${d.reference}). ${d.interpretation}`));
  watched.forEach((d) => findings.push(`${d.label}: ${d.display} (ref ${d.reference}). ${d.interpretation}`));
  if (!findings.length) findings.push("No biomarker exceeded screening thresholds across ocular, facial, vocal and speech domains.");

  const followUps: string[] = [];
  if (triage === "Urgent") {
    followUps.push("Same-week neurology referral for full motor and cranial nerve examination.");
    followUps.push("If any acute onset of facial droop, speech change or weakness: treat as emergency and seek stroke services immediately.");
    followUps.push("Consider neuroimaging (MRI brain) at the discretion of the treating physician.");
  } else if (triage === "Priority") {
    followUps.push("Primary-care review within 2-4 weeks with focused neurological examination.");
    followUps.push("Repeat NeuroVitals screen in 2 weeks under standardised lighting and quiet conditions to confirm trend.");
  } else {
    followUps.push("No urgent action indicated. Re-screen in 6-12 months or if symptoms develop.");
  }
  if (flagged.some((d) => d.group === "Vocal" || d.group === "Speech")) followUps.push("Speech-language pathology assessment for voice and fluency.");
  if (flagged.some((d) => d.key === "blink" || d.key === "pupil")) followUps.push("Medication and sleep review; consider ophthalmic and autonomic assessment.");
  followUps.push("Clinician to review raw telemetry attached to this report before acting on findings.");

  const summary = `${patient.name || "Patient"}, ${patient.age}y ${patient.sex}, completed a ${Math.round(face.durationSec + voice.durationSec)}-second multimodal screen. Composite neurological risk is ${overallRisk}% (${triage.toLowerCase()} triage) with ${confidence}% analytic confidence. ${flagged.length} domain(s) flagged and ${watched.length} on watch. ${
    patient.concern ? `Reported concern: "${patient.concern}". ` : ""
  }This is a screening aid and not a diagnosis.`;

  return {
    id: patient.sessionId,
    createdAt: new Date().toISOString(),
    patient,
    face,
    voice,
    overallRisk,
    confidence,
    triage,
    domains,
    findings,
    followUps,
    summary,
  };
}
