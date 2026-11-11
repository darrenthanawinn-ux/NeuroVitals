# NeuroVitals AI

Neurological screening and cognitive triage platform built for **DSH Hacks V2** (AI x Healthcare).

Multimodal screening flow (facial motor test + vocal biomarker test) that produces a physician-ready triage report, with all processing done locally in the browser.

## Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

Production build: `npm run build && npm start`

Requires Node 18.17+.

## What is in the app

| Route | Purpose |
| --- | --- |
| `/` | Landing page, feature overview, privacy/compliance banner |
| `/dashboard` | Local screening history, trend chart, one-click demo cases |
| `/screening` | 4-step flow: consent, facial motor test, vocal test, analysis |
| `/report/[id]` | Triage report: risk gauge, biometric cards, charts, findings, follow-ups, print/PDF, JSON export |

## Structure

```
app/            Next.js App Router pages (layout, landing, dashboard, screening, report/[id])
components/     UI: ConsentStep, FaceTest, VoiceTest, ProcessingStep, ReportView, RiskGauge, ...
lib/types.ts        Shared TypeScript types
lib/simulation.ts   Seeded facial + vocal telemetry simulators (profiles: typical / mild / elevated)
lib/analysis.ts     Scoring engine: domain risk, composite score, triage level, findings, follow-ups
lib/storage.ts      localStorage persistence (reports never leave the device)
lib/demo.ts         Demo report generator
```

## Important notes (honest scope)

- **Biomarkers are simulated.** Facial landmarks, blink rate, pupil stability, symmetry, pitch, tremor and pause metrics are synthesised from the telemetry profile selected on the consent step, so every outcome can be demonstrated reliably. The optional webcam preview and microphone waveform are real, local-only inputs, but they do not drive the scores.
- Scoring thresholds in `lib/analysis.ts` are illustrative reference bands, not clinically validated.
- HIPAA/GDPR language describes design intent (local-first, no upload, erasure on demand), not a certification.
- This is a research prototype, not a medical device, and not a diagnostic tool.

## Swapping in real analysis

Replace `FaceSimulator` (lib/simulation.ts) with MediaPipe Face Landmarker output and `simulateVoice` with pitch tracking over the Web Audio analyser data; keep the `FaceMetrics` / `VoiceMetrics` shapes and the rest of the app works unchanged.
