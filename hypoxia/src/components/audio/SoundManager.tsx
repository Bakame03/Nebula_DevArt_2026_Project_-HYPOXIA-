"use client";
import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { playbackRateFromStress } from "@/utils/heartbeat";

// ─── Utilities ────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Audio Synthesis Helpers ──────────────────────────────────────────────────

/** Pink noise buffer (Voss-McCartney algorithm) — excellent river simulation. */
function createPinkNoiseBuffer(ctx: AudioContext, duration = 3): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, sr * duration, sr);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buf;
}

/** Fetch and decode a real audio file using Web Audio API. */
async function loadAudioBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer | null> {
  try {
    const res = await fetch(url);
    const raw = await res.arrayBuffer();
    return await ctx.decodeAudioData(raw);
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SoundManager() {
  const stressLevel = useStore((s) => s.stressLevel);
  const stressRef = useRef(stressLevel);
  stressRef.current = stressLevel;

  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const started = useRef(false);

  // River nodes
  const riverGainRef = useRef<GainNode | null>(null);
  const riverFilterRef = useRef<BiquadFilterNode | null>(null);

  // Birds nodes
  const birdMasterRef = useRef<GainNode | null>(null);
  type BirdOsc = { osc: OscillatorNode; gain: GainNode; freq: number; speed: number; phase: number };
  const birdsRef = useRef<BirdOsc[]>([]);

  // Heartbeat nodes
  const heartSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const heartGainRef = useRef<GainNode | null>(null);

  // Alert nodes
  const alertOscRef = useRef<OscillatorNode | null>(null);
  const alertGainRef = useRef<GainNode | null>(null);

  // Lerped values for smooth transitions
  const curRiverVol = useRef(0.6);
  const curRiverFreq = useRef(2000);
  const curBirdVol = useRef(0.4);
  const curHeartVol = useRef(0.0);
  const curHeartRate = useRef(1.0);
  const curAlertVol = useRef(0.0);

  const buildAudio = useCallback(async () => {
    if (started.current) return;
    started.current = true;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // ── River ───────────────────────────────────────────────────────────────
    const pinkBuf = createPinkNoiseBuffer(ctx);
    const riverSrc = ctx.createBufferSource();
    riverSrc.buffer = pinkBuf;
    riverSrc.loop = true;

    const riverFilter = ctx.createBiquadFilter();
    riverFilter.type = "lowpass";
    riverFilter.frequency.value = 2000;
    riverFilter.Q.value = 0.5;
    riverFilterRef.current = riverFilter;

    const riverGain = ctx.createGain();
    riverGain.gain.value = 0.6;
    riverGainRef.current = riverGain;

    riverSrc.connect(riverFilter);
    riverFilter.connect(riverGain);
    riverGain.connect(ctx.destination);
    riverSrc.start();

    // ── Birds ───────────────────────────────────────────────────────────────
    const birdMaster = ctx.createGain();
    birdMaster.gain.value = 0.4;
    birdMaster.connect(ctx.destination);
    birdMasterRef.current = birdMaster;

    birdsRef.current = Array.from({ length: 6 }, (_, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const freq = 2200 + i * 380 + Math.random() * 200;
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(birdMaster);
      osc.start();

      return { osc, gain, freq, speed: 0.4 + Math.random() * 0.8, phase: i * 1.05 };
    });

    // ── Heartbeat — real audio file ─────────────────────────────────────────
    // Load the actual recorded heartbeat (heartbeat_heavy.mp3).
    // playbackRate controls the BPM: 1.0 = native speed (≈60 BPM),
    // increasing toward 2.0 at max stress (≈120 BPM).
    const heartGain = ctx.createGain();
    heartGain.gain.value = 0;
    heartGainRef.current = heartGain;
    heartGain.connect(ctx.destination);

    const heartBuf = await loadAudioBuffer(ctx, "/sounds/heartbeat_heavy.mp3");
    if (heartBuf) {
      const heartSrc = ctx.createBufferSource();
      heartSrc.buffer = heartBuf;
      heartSrc.loop = true;
      heartSrc.playbackRate.value = 1.0;
      heartSourceRef.current = heartSrc;
      heartSrc.connect(heartGain);
      heartSrc.start();
    }

    // ── Alert ────────────────────────────────────────────────────────────────
    const alertOsc = ctx.createOscillator();
    alertOsc.type = "sawtooth";
    alertOsc.frequency.value = 440;
    alertOscRef.current = alertOsc;

    const alertFilter = ctx.createBiquadFilter();
    alertFilter.type = "bandpass";
    alertFilter.frequency.value = 440;
    alertFilter.Q.value = 2;

    const alertGain = ctx.createGain();
    alertGain.gain.value = 0;
    alertGainRef.current = alertGain;

    alertOsc.connect(alertFilter);
    alertFilter.connect(alertGain);
    alertGain.connect(ctx.destination);
    alertOsc.start();

    // ── Animation loop ───────────────────────────────────────────────────────
    let t = 0;
    const SPEED = 0.05;

    const update = (dt: number) => {
      t += dt;
      const stress = stressRef.current;

      // River: volume and filter cut off as stress rises
      const rvTarget = clamp(0.6 * (1 - stress), 0, 0.6);
      const rfTarget = clamp(2000 - stress * 1850, 150, 2000);
      curRiverVol.current = lerp(curRiverVol.current, rvTarget, SPEED);
      curRiverFreq.current = lerp(curRiverFreq.current, rfTarget, SPEED);
      riverGain.gain.value = curRiverVol.current;
      riverFilter.frequency.value = curRiverFreq.current;

      // Birds: fade out with stress; individual gain oscillates to simulate chirps
      const bvTarget = clamp(0.4 * (1 - stress * 1.2), 0, 0.4);
      curBirdVol.current = lerp(curBirdVol.current, bvTarget, SPEED);
      birdMaster.gain.value = curBirdVol.current;
      birdsRef.current.forEach((b) => {
        const chirp = Math.max(0, Math.sin(t * b.speed + b.phase)) ** 3;
        b.gain.gain.value = chirp * 0.6;
      });

      // Heartbeat: real file — fade in from stress 0, speed up with stress
      const heartSrc = heartSourceRef.current;
      const heartStress = clamp(stress / 1.0, 0, 1);
      // Volume: gentle curve, audible from very low stress
      const hvTarget = Math.pow(heartStress, 1.2) * 0.85;
      // Rate: derived from the shared heartbeat model so the audio beats at the
      // same BPM shown on the EKG / readout (1.0 when calm → BPM_MAX/file BPM).
      const hrTarget = playbackRateFromStress(stress);
      curHeartVol.current = lerp(curHeartVol.current, hvTarget, SPEED);
      curHeartRate.current = lerp(curHeartRate.current, hrTarget, SPEED);
      heartGain.gain.value = curHeartVol.current;
      if (heartSrc) heartSrc.playbackRate.value = curHeartRate.current;

      // Alert: only at full saturation
      const avTarget = stress >= 1.0 ? 0.7 : 0;
      curAlertVol.current = lerp(curAlertVol.current, avTarget, SPEED * 3);
      alertGain.gain.value = curAlertVol.current;
      alertOsc.frequency.value = 380 + Math.sin(t * 2) * 80;

      rafRef.current = requestAnimationFrame(() => update(1 / 60));
    };

    rafRef.current = requestAnimationFrame(() => update(1 / 60));
  }, []);

  useEffect(() => {
    const handle = () => {
      if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
      buildAudio();
      window.removeEventListener("click", handle);
      window.removeEventListener("keydown", handle);
      window.removeEventListener("touchstart", handle);
    };

    window.addEventListener("click", handle);
    window.addEventListener("keydown", handle);
    window.addEventListener("touchstart", handle);
    buildAudio(); // attempt auto-start (will be blocked by browser, fallback to events)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("click", handle);
      window.removeEventListener("keydown", handle);
      window.removeEventListener("touchstart", handle);
      ctxRef.current?.close();
      started.current = false;
    };
  }, [buildAudio]);

  return null;
}
