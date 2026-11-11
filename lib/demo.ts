import type { Profile, Report, PatientMeta } from "./types";
import { FaceSimulator, hashString, simulateVoice } from "./simulation";
import { buildReport } from "./analysis";

export function makeDemoReport(profile: Profile = "mild", name = "Demo Patient", age = 61): Report {
  const meta: PatientMeta = {
    sessionId: `demo-${profile}`,
    name,
    age,
    sex: "Female",
    concern: "Occasional hand tremor and softer voice over the past few months",
    profile,
    useCamera: false,
    consentedAt: new Date().toISOString(),
  };
  const sim = new FaceSimulator(hashString(meta.sessionId), profile);
  const dur = 20;
  for (let t = 0; t < dur; t += 1 / 30) sim.frame(t);
  const face = sim.finalize(dur);
  const voice = simulateVoice(hashString(meta.sessionId), profile, 15, false);
  return buildReport(meta, face, voice);
}
