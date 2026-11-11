"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Play, RotateCcw } from "lucide-react";
import type { FaceMetrics, PatientMeta } from "@/lib/types";
import { FaceSimulator, hashString } from "@/lib/simulation";

const DURATION = 20;
const W = 640;
const H = 400;

// Normalised face landmark layout (x,y in -1..1 around face centre)
const landmarks: { x: number; y: number }[] = (() => {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 17; i++) {
    const a = Math.PI * (0.12 + (i / 16) * 0.76);
    pts.push({ x: Math.cos(a) * 0.78, y: 0.05 + Math.sin(a) * 0.95 });
  }
  for (let i = 0; i < 5; i++) {
    pts.push({ x: -0.62 + i * 0.1, y: -0.52 - Math.sin((i / 4) * Math.PI) * 0.08 });
    pts.push({ x: 0.22 + i * 0.1, y: -0.52 - Math.sin((i / 4) * Math.PI) * 0.08 });
  }
  for (let i = 0; i < 5; i++) pts.push({ x: 0, y: -0.3 + i * 0.12 });
  for (let i = 0; i < 5; i++) pts.push({ x: -0.14 + i * 0.07, y: 0.28 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    pts.push({ x: Math.cos(a) * 0.26, y: 0.52 + Math.sin(a) * 0.08 });
  }
  return pts;
})();

interface Live {
  blinks: number;
  rate: number;
  symmetry: number;
  pupil: number;
  elapsed: number;
}

export default function FaceTest({
  meta,
  onComplete,
}: {
  meta: PatientMeta;
  onComplete: (m: FaceMetrics) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const simRef = useRef<FaceSimulator | null>(null);
  const histRef = useRef<number[]>([]);
  const lastUiRef = useRef(0);
  const camRef = useRef<"off" | "on" | "denied">("off");

  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [camStatus, setCamStatus] = useState<"off" | "on" | "denied">("off");
  const [live, setLive] = useState<Live>({ blinks: 0, rate: 0, symmetry: 100, pupil: 1, elapsed: 0 });
  const [result, setResult] = useState<FaceMetrics | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const drawIdle = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.font = "14px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Press Start. Look at the camera, keep a neutral face and blink naturally.", W / 2, H / 2);
  }, []);

  useEffect(() => {
    drawIdle();
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopStream();
    };
  }, [drawIdle, stopStream]);

  const draw = useCallback(
    (t: number, f: ReturnType<FaceSimulator["frame"]>) => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const v = videoRef.current;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0b1226");
      g.addColorStop(1, "#020617");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      if (camRef.current === "on" && v && v.readyState >= 2) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(v, 0, 0, W, H);
        ctx.restore();
        ctx.fillStyle = "rgba(2,6,23,0.35)";
        ctx.fillRect(0, 0, W, H);
      }

      const cx = W / 2 + f.jitter;
      const cy = H / 2 + 6;
      const rx = 118;
      const ry = 150;

      // face outline
      ctx.strokeStyle = "rgba(34,211,238,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // symmetry axis
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.beginPath();
      ctx.moveTo(cx, cy - ry - 18);
      ctx.lineTo(cx, cy + ry + 18);
      ctx.stroke();
      ctx.setLineDash([]);

      // landmarks
      const skew = (100 - f.symmetry) * 0.22;
      const bad = f.symmetry < 88;
      landmarks.forEach((p) => {
        const side = p.x < 0 ? -1 : p.x > 0 ? 1 : 0;
        const x = cx + p.x * rx * 1.1;
        const y = cy + p.y * ry * 0.95 + side * skew;
        ctx.fillStyle = bad && side !== 0 ? "rgba(251,113,133,0.9)" : "rgba(45,212,191,0.9)";
        ctx.beginPath();
        ctx.arc(x, y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      });

      // eyes
      const eye = (ex: number, open: number, drop: number) => {
        const ey = cy - 38 + drop;
        const h = 15 * open + 1.5;
        ctx.fillStyle = "rgba(226,232,240,0.9)";
        ctx.beginPath();
        ctx.ellipse(ex, ey, 26, h, 0, 0, Math.PI * 2);
        ctx.fill();
        if (open > 0.3) {
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.arc(ex, ey, 9.5 * f.pupil * Math.min(1, open + 0.2), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(34,211,238,0.9)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ex, ey, 14, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(34,211,238,0.55)";
        ctx.lineWidth = 1;
        ctx.strokeRect(ex - 34, ey - 24, 68, 48);
      };
      eye(cx - 50, f.leftEye, -skew * 0.5);
      eye(cx + 50, f.rightEye, skew * 0.5);

      // mouth
      ctx.strokeStyle = "rgba(226,232,240,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 34, cy + 82 - skew * 0.4);
      ctx.quadraticCurveTo(cx, cy + 90, cx + 34, cy + 82 + skew * 0.4);
      ctx.stroke();

      // scan line
      const sy = ((t * 110) % (ry * 2 + 40)) + cy - ry - 20;
      const sg = ctx.createLinearGradient(0, sy - 18, 0, sy + 2);
      sg.addColorStop(0, "rgba(34,211,238,0)");
      sg.addColorStop(1, "rgba(34,211,238,0.35)");
      ctx.fillStyle = sg;
      ctx.fillRect(cx - rx - 30, sy - 18, (rx + 30) * 2, 20);

      // blink flash
      if (f.blinking) {
        ctx.fillStyle = "rgba(251,191,36,0.9)";
        ctx.font = "600 12px ui-sans-serif, system-ui";
        ctx.textAlign = "left";
        ctx.fillText("BLINK", cx + 100, cy - 90);
      }

      // symmetry sparkline
      const hist = histRef.current;
      hist.push(f.symmetry);
      if (hist.length > 160) hist.shift();
      const sx0 = 16;
      const sy0 = H - 16;
      const sw = 180;
      const sh = 42;
      ctx.fillStyle = "rgba(2,6,23,0.6)";
      ctx.fillRect(sx0 - 6, sy0 - sh - 18, sw + 12, sh + 28);
      ctx.fillStyle = "rgba(148,163,184,0.8)";
      ctx.font = "10px ui-sans-serif, system-ui";
      ctx.textAlign = "left";
      ctx.fillText("SYMMETRY TRACE", sx0, sy0 - sh - 6);
      ctx.strokeStyle = "rgba(45,212,191,0.95)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      hist.forEach((val, i) => {
        const x = sx0 + (i / 159) * sw;
        const y = sy0 - ((Math.min(100, Math.max(60, val)) - 60) / 40) * sh;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // HUD
      ctx.fillStyle = "rgba(226,232,240,0.9)";
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "right";
      ctx.fillText(`t=${t.toFixed(1)}s  SYM ${f.symmetry.toFixed(1)}%  PUPIL ${f.pupil.toFixed(3)}`, W - 14, 22);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(251,113,133,0.9)";
      ctx.fillText("● REC (local only)", 14, 22);
    },
    []
  );

  const start = async () => {
    cancelAnimationFrame(rafRef.current);
    histRef.current = [];
    setResult(null);
    simRef.current = new FaceSimulator(hashString(meta.sessionId + ":face"), meta.profile);

    if (meta.useCamera && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 400, facingMode: "user" }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        camRef.current = "on";
        setCamStatus("on");
      } catch {
        camRef.current = "denied";
        setCamStatus("denied");
      }
    } else {
      camRef.current = "off";
      setCamStatus("off");
    }

    setPhase("running");
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      const sim = simRef.current;
      if (!sim) return;
      const f = sim.frame(t);
      draw(t, f);
      if (now - lastUiRef.current > 120) {
        lastUiRef.current = now;
        const blinks = sim.blinkTimes.length;
        setLive({ blinks, rate: t > 2 ? (blinks / t) * 60 : 0, symmetry: f.symmetry, pupil: f.pupil, elapsed: t });
      }
      if (t >= DURATION) {
        const m = sim.finalize(DURATION);
        stopStream();
        setResult(m);
        setLive((l) => ({ ...l, elapsed: DURATION, blinks: m.blinkTimes.length, rate: m.blinkRate }));
        setPhase("done");
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    stopStream();
    setPhase("idle");
    setResult(null);
    setLive({ blinks: 0, rate: 0, symmetry: 100, pupil: 1, elapsed: 0 });
    setTimeout(drawIdle, 0);
  };

  const pct = Math.min(100, (live.elapsed / DURATION) * 100);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
        <canvas ref={canvasRef} width={W} height={H} className="block h-auto w-full" />
        <video ref={videoRef} className="hidden" playsInline muted />
        {phase === "running" && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
            <div className="h-full bg-cyan-400 transition-[width] duration-150" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {camStatus === "denied" && (
        <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Camera access was denied, so the test is running with the simulated feed instead. Results are unaffected in demo mode.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Blinks", v: String(live.blinks) },
          { l: "Blink rate", v: live.rate ? `${live.rate.toFixed(1)}/min` : "--" },
          { l: "Symmetry", v: `${live.symmetry.toFixed(1)}%` },
          { l: "Pupil stability", v: phase === "done" && result ? `${result.pupilStability}%` : `${live.pupil.toFixed(3)}` },
        ].map((m) => (
          <div key={m.l} className="glass px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">{m.l}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{m.v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {phase === "idle" && `A ${DURATION}-second capture. Face tracking is simulated; the webcam preview is optional.`}
          {phase === "running" && `Capturing… ${Math.max(0, DURATION - live.elapsed).toFixed(0)}s remaining`}
          {phase === "done" && "Capture complete. Review the metrics above, then continue."}
        </p>
        <div className="flex gap-3">
          {phase !== "idle" && (
            <button type="button" className="btn-ghost" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Redo
            </button>
          )}
          {phase === "idle" && (
            <button type="button" className="btn-primary" onClick={start}>
              <Play className="h-4 w-4" /> Start facial motor test
            </button>
          )}
          {phase === "done" && result && (
            <button type="button" className="btn-primary" onClick={() => onComplete(result)}>
              Continue to vocal test <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
