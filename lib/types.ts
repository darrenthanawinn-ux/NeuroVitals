export type Profile = "typical" | "mild" | "elevated";

export interface PatientMeta {
  sessionId: string;
  name: string;
  age: number;
  sex: string;
  concern: string;
  profile: Profile;
  useCamera: boolean;
  consentedAt: string;
}

export interface FaceSample {
  t: number;
  symmetry: number;
  pupil: number;
}

export interface FaceMetrics {
  blinkRate: number; // blinks / min
  pupilStability: number; // 0-100
  symmetry: number; // 0-100
  asymmetryEvents: number;
  durationSec: number;
  blinkTimes: number[];
  samples: FaceSample[];
}

export interface VoiceSample {
  t: number;
  pitch: number | null; // Hz, null during pauses
  amp: number; // 0-1
}

export interface VoiceMetrics {
  pitchMean: number; // Hz
  pitchVariability: number; // semitones (std dev)
  tremorHz: number;
  tremorAmplitude: number; // % pitch modulation
  pauseRatio: number; // % of utterance
  meanPauseMs: number;
  speechRate: number; // syllables / sec
  durationSec: number;
  micCaptured: boolean;
  pauses: { start: number; end: number }[];
  samples: VoiceSample[];
}

export type Triage = "Routine" | "Priority" | "Urgent";
export type Status = "normal" | "watch" | "flag";

export interface DomainScore {
  key: string;
  label: string;
  group: "Ocular" | "Facial" | "Vocal" | "Speech";
  display: string;
  reference: string;
  risk: number; // 0-100
  status: Status;
  interpretation: string;
  weight: number;
}

export interface Report {
  id: string;
  createdAt: string;
  patient: PatientMeta;
  face: FaceMetrics;
  voice: VoiceMetrics;
  overallRisk: number;
  confidence: number;
  triage: Triage;
  domains: DomainScore[];
  findings: string[];
  followUps: string[];
  summary: string;
}
