import type {
  FaceMetrics,
  FaceSample,
  Profile,
  VoiceMetrics,
  VoiceSample,
} from "./types";

/** Deterministic-ish seeded RNG so a session is reproducible. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

interface FaceParams {
  blink: number;
  pupilNoise: number;
  asym: number;
}

export const FACE_PROFILES: Record<Profile, FaceParams> = {
  typical: { blink: 17, pupilNoise: 0.012, asym: 0.015 },
  mild: { blink: 11, pupilNoise: 0.035, asym: 0.06 },
  elevated: { blink: 6, pupilNoise: 0.07, asym: 0.13 },
};

interface VoiceParams {
  pitchMean: number;
  pitchSd: number;
  tremorHz: number;
  tremorAmp: number;
  pauseRatio: number;
  rate: number;
}

export const VOICE_PROFILES: Record<Profile, VoiceParams> = {
  typical: { pitchMean: 140, pitchSd: 2.6, tremorHz: 0, tremorAmp: 0.4, pauseRatio: 16, rate: 4.4 },
  mild: { pitchMean: 134, pitchSd: 1.7, tremorHz: 5.1, tremorAmp: 1.8, pauseRatio: 27, rate: 3.5 },
  elevated: { pitchMean: 128, pitchSd: 1.0, tremorHz: 5.8, tremorAmp: 3.6, pauseRatio: 41, rate: 2.5 },
};

/** Live frame generator for the facial motor test canvas. */
export interface FaceFrame {
  t: number; // seconds
  leftEye: number; // openness 0-1
  rightEye: number;
  pupil: number; // normalised diameter
  symmetry: number; // 0-100 live
  blinking: boolean;
  jitter: number; // px head micro-motion
}

export class FaceSimulator {
  private rand: () => number;
  private params: FaceParams;
  private nextBlink: number;
  private blinkUntil = 0;
  blinkTimes: number[] = [];
  samples: FaceSample[] = [];
  asymmetryEvents = 0;
  private lastAsym = false;

  constructor(seed: number, profile: Profile) {
    this.rand = mulberry32(seed);
    this.params = FACE_PROFILES[profile];
    this.nextBlink = this.interval();
  }

  private interval() {
    const mean = 60 / this.params.blink;
    return mean * (0.55 + this.rand() * 0.9);
  }

  frame(t: number): FaceFrame {
    const p = this.params;
    let blinking = false;
    if (t >= this.nextBlink) {
      this.blinkTimes.push(t);
      this.blinkUntil = t + 0.15;
      this.nextBlink = t + this.interval();
    }
    if (t < this.blinkUntil) blinking = true;
    const phase = blinking ? 1 - Math.abs((this.blinkUntil - t) / 0.15 - 0.5) * 2 : 0;
    const asym = p.asym * (0.6 + 0.4 * Math.sin(t * 0.9)) + (this.rand() - 0.5) * p.asym * 0.6;
    const open = 1 - phase * 0.95;
    const leftEye = clamp(open - asym * 0.5, 0, 1);
    const rightEye = clamp(open + asym * 0.5 * (blinking ? 0.2 : 1), 0, 1);
    const pupil = 1 + Math.sin(t * 2.1) * p.pupilNoise + (this.rand() - 0.5) * p.pupilNoise * 2;
    const symmetry = clamp(100 - Math.abs(asym) * 260 - (this.rand() * 0.8), 0, 100);
    const asymFlag = Math.abs(asym) > 0.09;
    if (asymFlag && !this.lastAsym) this.asymmetryEvents++;
    this.lastAsym = asymFlag;
    if (this.samples.length === 0 || t - this.samples[this.samples.length - 1].t >= 0.25) {
      this.samples.push({ t: +t.toFixed(2), symmetry, pupil });
    }
    return {
      t,
      leftEye,
      rightEye,
      pupil,
      symmetry,
      blinking,
      jitter: (this.rand() - 0.5) * (1 + p.asym * 20),
    };
  }

  finalize(durationSec: number): FaceMetrics {
    const sym = this.samples.map((s) => s.symmetry);
    const pup = this.samples.map((s) => s.pupil);
    const meanSym = sym.length ? sym.reduce((a, b) => a + b, 0) / sym.length : 90;
    const pm = pup.length ? pup.reduce((a, b) => a + b, 0) / pup.length : 1;
    const sd = pup.length
      ? Math.sqrt(pup.reduce((a, b) => a + (b - pm) ** 2, 0) / pup.length)
      : 0.01;
    const blinkRate = durationSec > 0 ? (this.blinkTimes.length / durationSec) * 60 : 15;
    return {
      blinkRate: +blinkRate.toFixed(1),
      pupilStability: +clamp(100 - (sd / 0.1) * 100, 0, 100).toFixed(1),
      symmetry: +meanSym.toFixed(1),
      asymmetryEvents: this.asymmetryEvents,
      durationSec: +durationSec.toFixed(1),
      blinkTimes: this.blinkTimes.slice(),
      samples: this.samples.slice(),
    };
  }
}

/** Synthetic voice analysis used when the microphone is unavailable or as the data model for the report. */
export function simulateVoice(
  seed: number,
  profile: Profile,
  durationSec: number,
  micCaptured: boolean,
  liveAmp?: number[]
): VoiceMetrics {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const p = VOICE_PROFILES[profile];
  const samples: VoiceSample[] = [];
  const pauses: { start: number; end: number }[] = [];
  const step = 0.1;
  let inPause = false;
  let pauseStart = 0;
  let nextToggle = 1 + rand() * 1.5;
  for (let t = 0; t < durationSec; t += step) {
    if (t >= nextToggle) {
      if (inPause) {
        pauses.push({ start: pauseStart, end: t });
        inPause = false;
        nextToggle = t + (0.8 + rand() * 2.4) * (1.2 - p.pauseRatio / 100);
      } else {
        inPause = true;
        pauseStart = t;
        const len = 0.15 + rand() * 0.5 * (1 + p.pauseRatio / 25);
        nextToggle = t + len;
      }
    }
    const tremor = p.tremorHz ? Math.sin(2 * Math.PI * p.tremorHz * t) * p.tremorAmp * 0.5 : 0;
    const drift = Math.sin(t * 0.7) * p.pitchSd * 0.7 + (rand() - 0.5) * p.pitchSd * 0.5;
    const semis = drift + tremor;
    const pitch = inPause ? null : p.pitchMean * Math.pow(2, semis / 12);
    const baseAmp = inPause ? 0.03 : 0.45 + 0.25 * Math.sin(t * 3.1) + (rand() - 0.5) * 0.15;
    const live = liveAmp && liveAmp.length ? liveAmp[Math.min(liveAmp.length - 1, Math.floor((t / durationSec) * liveAmp.length))] : null;
    const amp = clamp(live !== null ? 0.5 * baseAmp + 0.5 * live : baseAmp, 0, 1);
    samples.push({ t: +t.toFixed(2), pitch, amp });
  }
  if (inPause) pauses.push({ start: pauseStart, end: durationSec });

  const pitches = samples.filter((s) => s.pitch !== null).map((s) => s.pitch as number);
  const mean = pitches.reduce((a, b) => a + b, 0) / Math.max(1, pitches.length);
  const semi = pitches.map((x) => 12 * Math.log2(x / mean));
  const sd = Math.sqrt(semi.reduce((a, b) => a + b * b, 0) / Math.max(1, semi.length));
  const pauseTotal = pauses.reduce((a, b) => a + (b.end - b.start), 0);
  const meanPause = pauses.length ? (pauseTotal / pauses.length) * 1000 : 0;

  return {
    pitchMean: +mean.toFixed(1),
    pitchVariability: +sd.toFixed(2),
    tremorHz: p.tremorHz ? +(p.tremorHz + (rand() - 0.5) * 0.4).toFixed(1) : 0,
    tremorAmplitude: +(p.tremorAmp * (0.9 + rand() * 0.2)).toFixed(2),
    pauseRatio: +((pauseTotal / durationSec) * 100).toFixed(1),
    meanPauseMs: Math.round(meanPause),
    speechRate: +(p.rate * (0.92 + rand() * 0.16)).toFixed(1),
    durationSec: +durationSec.toFixed(1),
    micCaptured,
    pauses,
    samples,
  };
}
