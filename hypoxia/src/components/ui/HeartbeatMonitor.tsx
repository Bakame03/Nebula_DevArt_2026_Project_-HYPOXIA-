"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { bpmFromStress } from "@/utils/heartbeat";

const W = 140;
const H = 32;

/**
 * ECG waveform sample from beat phase (0..1).
 * Returns a value in [-1, 1] — 0 is the baseline.
 */
function ekgAt(phase: number): number {
  // P wave: small positive hump 8-18%
  if (phase > 0.08 && phase < 0.18) {
    const p = (phase - 0.08) / 0.10;
    return 0.20 * Math.sin(Math.PI * p);
  }
  // Q dip: tiny negative 21-24%
  if (phase > 0.21 && phase < 0.245) {
    const p = (phase - 0.21) / 0.035;
    return -0.16 * Math.sin(Math.PI * p);
  }
  // R spike: the dominant sharp upward 24-33%  ← the "lub"
  if (phase > 0.245 && phase < 0.33) {
    const p = (phase - 0.245) / 0.085;
    return Math.sin(Math.PI * p); // full amplitude
  }
  // S dip: small negative 33-37%
  if (phase > 0.33 && phase < 0.37) {
    const p = (phase - 0.33) / 0.04;
    return -0.28 * Math.sin(Math.PI * p);
  }
  // T wave: gentle positive hump 41-60%  ← the "dub"
  if (phase > 0.41 && phase < 0.60) {
    const p = (phase - 0.41) / 0.19;
    return 0.34 * Math.sin(Math.PI * p);
  }
  // Flat baseline for the rest (diastole)
  return 0;
}

export default function HeartbeatMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const prevTsRef = useRef<number>(0);
  // Phase accumulates continuously (0..∞), we take modulo 1 to get beat position
  const phaseAccRef = useRef<number>(0);
  const ringRef = useRef(new Float32Array(W).fill(0));
  const writeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const mid = H / 2;
    const margin = 3; // pixels from top/bottom

    const frame = (ts: number) => {
      const dt = Math.min((ts - prevTsRef.current) / 1000, 0.05); // seconds, capped
      prevTsRef.current = ts;

      const stress = useStore.getState().stressLevel;
      const bpm = bpmFromStress(stress);

      // Advance beat phase by dt * beats_per_second
      phaseAccRef.current = (phaseAccRef.current + dt * (bpm / 60)) % 1;

      // Sample EKG at current phase and write to ring buffer
      const sample = ekgAt(phaseAccRef.current);
      ringRef.current[writeRef.current % W] = sample;
      writeRef.current++;

      // ── Rendering ───────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);

      // Colour ramp: teal → amber → red
      const r = Math.round(30 + stress * 225);
      const g = Math.round(230 - stress * 190);
      const b = Math.round(80 - stress * 40);
      const colorStr = `${r},${g},${b}`;

      // Horizontal fade gradient (old → new, left → right)
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, `rgba(${colorStr},0)`);
      grad.addColorStop(0.35, `rgba(${colorStr},${(0.2 + stress * 0.4).toFixed(2)})`);
      grad.addColorStop(1, `rgba(${colorStr},${(0.7 + stress * 0.3).toFixed(2)})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = `rgba(${colorStr},0.55)`;
      ctx.shadowBlur = 4 + stress * 10;

      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        // Read ring from oldest → newest
        const idx = (writeRef.current + x) % W;
        const v = ringRef.current[idx];
        // Map [-1, 1] → [H - margin, margin]
        const y = mid - v * (mid - margin);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(frame);
    };

    prevTsRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="shrink-0"
      aria-hidden="true"
    />
  );
}
