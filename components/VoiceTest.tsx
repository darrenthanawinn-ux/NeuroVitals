"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Mic, RotateCcw, Square } from "lucide-react";
import type { PatientMeta, VoiceMetrics } from "@/lib/types";
import { hashString, simulateVoice } from "@/lib/simulation";

const DURATION = 15;
const W = 640;
const H = 200;

const PASSAGE =
  "The morning light spilled across the quiet harbour while the fishermen mended their nets. Slowly, the town began to wake: bakers opened their doors, children ran toward the old stone bridge, and a bell rang twice from the hill.";

export default function VoiceTest({
  meta,
  onComplete,
}: {
  meta: PatientMeta;
  onComplete: (m: VoiceMetrics) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ampRef = useRef<number[]>([]);
  const lastSampleRef = useRef(0);
  const lastUiRef = useRef(0);

  const [phase, setPhase] = useState<"idle" | "recording" | "done">("idle");
  const [mic, setMic] = useState<"unknown" | "live" | "denied">("unknown");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState<VoiceMetrics | null>(null);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") ctxRef.current.close().catch(() => undefined);
    ctxRef.current = null;
    analyserRef.current = null;
  }, []);

  const drawBase = useCallback((wave: number[] | null, t: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.lineWidth = 1;
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(167,139,250,0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (wave) {
      wave.forEach((v, i) => {
        const x = (i / (wave.length - 1)) * W;
        const y = H / 2 + v * (H / 2 - 8);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    } else {
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.font = "11px ui-monospace, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText(wave ? `t=${t.toFixed(1)}s` : "waiting for input", 12, 18);
  }, []);

  useEffect(() => {
    drawBase(null, 0);
    return cleanup;
  }, [cleanup, drawBase]);

  const start = async () => {
    cleanup();
    ampRef.current = [];
    setResult(null);
    setElapsed(0);

    let live = false;
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false }, video: false });
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const src = ctx.createMediaStreamSource(stream);
        const an = ctx.createAnalyser();
        an.fftSize = 1024;
        src.connect(an);
        streamRef.current = stream;
        ctxRef.current = ctx;
        analyserRef.current = an;
        live = true;
      } catch {
        live = false;
      }
    }
    setMic(live ? "live" : "denied");
    setPhase("recording");

    const t0 = performance.now();
    const buf = new Uint8Array(1024);
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      let wave: number[] = [];
      let rms = 0;
      if (analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
          if (i % 4 === 0) wave.push(v * 2.2);
        }
        rms = Math.sqrt(sum / buf.length);
      } else {
        const speaking = Math.sin(t * 1.3) + Math.sin(t * 2.9) > -0.6;
        const a = speaking ? 0.35 + 0.25 * Math.sin(t * 3.7) : 0.03;
        for (let i = 0; i < 256; i++) {
          wave.push(a * Math.sin(i * 0.35 + t * 18) * Math.sin(i * 0.05 + t));
        }
        rms = a * 0.5;
      }
      drawBase(wave, t);
      if (now - lastSampleRef.current > 100) {
        lastSampleRef.current = now;
        ampRef.current.push(Math.min(1, rms * 4));
      }
      if (now - lastUiRef.current > 120) {
        lastUiRef.current = now;
        setElapsed(t);
        setLevel(Math.min(1, rms * 4));
      }
      if (t >= DURATION) {
        const m = simulateVoice(hashString(meta.sessionId + ":voice"), meta.profile, DURATION, live, ampRef.current);
        cleanup();
        setResult(m);
        setElapsed(DURATION);
        setLevel(0);
        setPhase("done");
        drawBase(null, 0);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const stopEarly = () => {
    if (elapsed < 5) return;
    const m = simulateVoice(hashString(meta.sessionId + ":voice"), meta.profile, Math.max(5, elapsed), mic === "live", ampRef.current);
    cleanup();
    setResult(m);
    setLevel(0);
    setPhase("done");
    drawBase(null, 0);
  };

  const reset = () => {
    cleanup();
    setPhase("idle");
    setResult(null);
    setElapsed(0);
    setLevel(0);
    setTimeout(() => drawBase(null, 0), 0);
  };

  return (
    <div className="space-y-5">
      <div className="glass p-5">
        <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-400">Read aloud at a natural pace</div>
        <p className="text-base leading-relaxed text-slate-200">{PASSAGE}</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
        <canvas ref={canvasRef} width={W} height={H} className="block h-auto w-full" />
        {phase === "recording" && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
            <div className="h-full bg-violet-400 transition-[width] duration-150" style={{ width: `${(elapsed / DURATION) * 100}%` }} />
          </div>
        )}
      </div>

      {mic === "denied" && phase !== "idle" && (
        <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Microphone unavailable or denied, so a simulated voice stream is used. Demo results are unaffected.
        </p>
      )}

      {phase === "done" && result ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Mean pitch", v: `${result.pitchMean} Hz` },
            { l: "Pitch variability", v: `${result.pitchVariability} st` },
            { l: "Pause ratio", v: `${result.pauseRatio}%` },
            { l: "Tremor", v: result.tremorHz ? `${result.tremorHz} Hz` : "None" },
          ].map((m) => (
            <div key={m.l} className="glass px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{m.l}</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{m.v}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass flex items-center gap-4 px-4 py-3">
          <Mic className={`h-5 w-5 ${phase === "recording" ? "text-violet-300" : "text-slate-500"}`} />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-[width] duration-100" style={{ width: `${level * 100}%` }} />
          </div>
          <span className="w-12 text-right text-xs tabular-nums text-slate-400">{phase === "recording" ? `${elapsed.toFixed(0)}s` : `${DURATION}s`}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {phase === "idle" && "Allow the microphone for a live waveform, or continue without it. Audio is analysed in memory and discarded."}
          {phase === "recording" && "Recording… keep reading until the bar completes."}
          {phase === "done" && "Capture complete. Continue to generate the triage report."}
        </p>
        <div className="flex gap-3">
          {phase === "idle" && (
            <button type="button" className="btn-primary" onClick={start}>
              <Mic className="h-4 w-4" /> Start vocal test
            </button>
          )}
          {phase === "recording" && (
            <button type="button" className="btn-ghost" onClick={stopEarly} disabled={elapsed < 5}>
              <Square className="h-4 w-4" /> Finish early
            </button>
          )}
          {phase === "done" && (
            <>
              <button type="button" className="btn-ghost" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Redo
              </button>
              <button type="button" className="btn-primary" onClick={() => result && onComplete(result)}>
                Generate triage report <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
