"use client";
import { useEffect, useRef, useCallback } from 'react';
import { Howl, Howler } from 'howler';
import { useStore } from '@/store/useStore';

// ============================================================
// 🫁 SoundManager — L'Angoisse Sonore d'HYPOXIA
// ============================================================
// 5 couches sonores : FLEUVE + OISEAUX → SUFFOCATION + CŒUR + DRONE
//
// Stress 0.0-0.2 : 🌊🐦 Fleuve vivant + oiseaux chantent
// Stress 0.2-0.5 : 🟡 Fleuve/oiseaux s'atténuent, suffoquement apparaît
// Stress 0.5-0.8 : 🔴 Fleuve étouffé, oiseaux meurent, cœur s'emballe
// Stress 0.8-1.0 : 💀 Silence mortel, suffoquement lourd, tachycardie
// ============================================================

/** Interpolation douce entre deux valeurs */
function lerp(current: number, target: number, speed: number): number {
  return current + (target - current) * speed;
}

/** Clamp une valeur entre min et max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function SoundManager() {
  const stressLevel = useStore((s) => s.stressLevel);

  // ─── Refs pour les instances Howl ─────────────────────────
  const riverRef = useRef<Howl | null>(null);      // 🌊 Fleuve
  const birdsRef = useRef<Howl | null>(null);      // 🐦 Oiseaux
  const breathRef = useRef<Howl | null>(null);     // 🫁 Suffoquement grave
  const heartRef = useRef<Howl | null>(null);      // 💓 Battement de cœur

  // ─── Refs pour le filtre passe-bas sur le fleuve ──────────
  const riverFilterRef = useRef<BiquadFilterNode | null>(null);
  const riverGainRef = useRef<GainNode | null>(null);

  // ─── Refs pour le drone Web Audio API ─────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  // ─── Valeurs lerpées pour transitions douces ──────────────
  const currentRiverVol = useRef(0.7);       // Fleuve fort
  const currentRiverFilter = useRef(2200);   // Filtre ouvert (Hz)
  const currentBirdsVol = useRef(0.5);       // Oiseaux audibles
  const currentBreathVol = useRef(0.0);      // Suffoquement muet
  const currentBreathRate = useRef(0.6);     // Rate grave
  const currentHeartVol = useRef(0.0);       // Cœur muet
  const currentHeartRate = useRef(0.6);      // Rate lent

  const currentDroneGain = useRef(0.0);      // Drone muet

  const rafRef = useRef<number | null>(null);
  const stressRef = useRef(stressLevel);
  stressRef.current = stressLevel;
  const audioStarted = useRef(false);

  // ─── Initialisation audio au premier clic ─────────────────
  const initAudio = useCallback(() => {
    if (audioStarted.current) return;
    audioStarted.current = true;

    // 🌊 Brancher le filtre passe-bas sur le fleuve via Web Audio
    try {
      const ctx = Howler.ctx;
      if (ctx && riverRef.current) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2200;
        filter.Q.value = 0.7;
        riverFilterRef.current = filter;

        const riverGain = ctx.createGain();
        riverGain.gain.value = 0.7;
        riverGainRef.current = riverGain;

        const soundIds = (riverRef.current as unknown as { _sounds: Array<{ _node: AudioNode }> })._sounds;
        if (soundIds && soundIds.length > 0) {
          const sourceNode = soundIds[0]._node;
          if (sourceNode && 'disconnect' in sourceNode) {
            sourceNode.disconnect();
            sourceNode.connect(filter);
            filter.connect(riverGain);
            riverGain.connect(ctx.destination);
          }
        }
      }
    } catch (e) {
      console.warn('[SoundManager] Impossible de brancher le filtre sur le fleuve:', e);
    }

    // 🌊 Lancer le fleuve
    if (riverRef.current) {
      riverRef.current.play();
    }

    // 🐦 Lancer les oiseaux
    if (birdsRef.current) {
      birdsRef.current.volume(0.5);
      birdsRef.current.play();
    }

    // 🫁 Lancer le suffoquement (muet, prêt à monter)
    if (breathRef.current) {
      breathRef.current.volume(0);
      breathRef.current.play();
    }

    // 💓 Lancer le cœur (muet, prêt à monter)
    if (heartRef.current) {
      heartRef.current.volume(0);
      heartRef.current.play();
    }

    // 🌊 Drone basse fréquence via Web Audio API
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 40;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      gainRef.current = gain;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.3;
      lfoRef.current = lfo;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0;
      lfoGainRef.current = lfoGain;

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(ctx.destination);
      oscRef.current = osc;

      osc.start();
      lfo.start();
    } catch (e) {
      console.warn('[SoundManager] Web Audio API non disponible:', e);
    }

    startUpdateLoop();
  }, []);

  // ─── Boucle de mise à jour (requestAnimationFrame) ────────
  const startUpdateLoop = useCallback(() => {
    const update = () => {
      const stress = stressRef.current;
      const lerpSpeed = 0.05;

      // ════════════════════════════════════════════════════════
      // 🌊 COUCHE 1 : FLEUVE (disparaît avec le stress)
      // ════════════════════════════════════════════════════════
      // Volume : 0.7 → 0.0 | Filtre : 2200 Hz → 150 Hz
      const riverVolTarget = clamp(0.7 * (1 - stress * 1.3), 0, 0.7);
      const riverFilterTarget = clamp(2200 - (stress * 2050), 150, 2200);

      currentRiverVol.current = lerp(currentRiverVol.current, riverVolTarget, lerpSpeed);
      currentRiverFilter.current = lerp(currentRiverFilter.current, riverFilterTarget, lerpSpeed);

      if (riverGainRef.current) {
        riverGainRef.current.gain.value = currentRiverVol.current;
      } else if (riverRef.current) {
        riverRef.current.volume(currentRiverVol.current);
      }

      if (riverFilterRef.current) {
        riverFilterRef.current.frequency.value = currentRiverFilter.current;
      }

      // ════════════════════════════════════════════════════════
      // 🐦 COUCHE 2 : OISEAUX (disparaissent comme le fleuve)
      // ════════════════════════════════════════════════════════
      // Volume : 0.5 → 0.0 (meurent avec l'écosystème)
      // Rate : 1.0 → 0.6 (ralentissent, comme s'ils s'éteignent)
      const birdsVolTarget = clamp(0.5 * (1 - stress * 1.4), 0, 0.5);

      currentBirdsVol.current = lerp(currentBirdsVol.current, birdsVolTarget, lerpSpeed);

      if (birdsRef.current) {
        birdsRef.current.volume(currentBirdsVol.current);
        birdsRef.current.rate(clamp(1.0 - stress * 0.4, 0.6, 1.0));
      }

      // ════════════════════════════════════════════════════════
      // 🫁 COUCHE 3 : SUFFOQUEMENT GRAVE (apparaît dès 10%)
      // ════════════════════════════════════════════════════════
      // Rate : 0.55 (très grave) → 0.35 (agonisant)
      // Volume : montée cubique puis max à 1.0 — TRÈS présent
      const breathStress = clamp((stress - 0.1) / 0.9, 0, 1);
      const breathVolTarget = breathStress * breathStress * breathStress * 1.0;
      const breathRateTarget = 0.55 - (breathStress * 0.2); // 0.55 → 0.35

      currentBreathVol.current = lerp(currentBreathVol.current, breathVolTarget, lerpSpeed);
      currentBreathRate.current = lerp(currentBreathRate.current, breathRateTarget, lerpSpeed);

      if (breathRef.current) {
        breathRef.current.volume(currentBreathVol.current);
        breathRef.current.rate(currentBreathRate.current);
      }

      // ════════════════════════════════════════════════════════
      // 💓 COUCHE 4 : BATTEMENT DE CŒUR (apparaît dès 20%)
      // ════════════════════════════════════════════════════════
      // Rate : 0.5 (très lent) → 2.8 (tachycardie extrême)
      // Volume max : 1.0 — TRÈS présent et oppressant
      const heartStress = clamp((stress - 0.2) / 0.8, 0, 1);
      const heartVolTarget = heartStress * heartStress * heartStress * 1.0;
      const heartRateTarget = 0.5 + heartStress * heartStress * 2.3; // 0.5 → 2.8

      currentHeartVol.current = lerp(currentHeartVol.current, heartVolTarget, lerpSpeed);
      currentHeartRate.current = lerp(currentHeartRate.current, heartRateTarget, lerpSpeed);

      if (heartRef.current) {
        heartRef.current.volume(currentHeartVol.current);
        heartRef.current.rate(currentHeartRate.current);
      }

      // ════════════════════════════════════════════════════════
      // 🌊 COUCHE 5 : DRONE HORRIBLE (apparaît dès 50%)
      // ════════════════════════════════════════════════════════
      const droneStress = clamp((stress - 0.5) / 0.5, 0, 1);
      const droneGainTarget = droneStress * droneStress * 0.18;

      currentDroneGain.current = lerp(currentDroneGain.current, droneGainTarget, lerpSpeed * 0.5);

      if (gainRef.current) {
        gainRef.current.gain.value = currentDroneGain.current;
      }

      if (oscRef.current) {
        oscRef.current.frequency.value = 40 + droneStress * 50;
      }

      if (lfoRef.current && lfoGainRef.current) {
        lfoRef.current.frequency.value = 0.3 + droneStress * 6;
        lfoGainRef.current.gain.value = droneStress * 0.1;
      }

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
  }, []);

  // ─── Effet principal : Chargement / Déchargement ──────────
  useEffect(() => {
    // 🌊 Fleuve (Web Audio mode pour le filtre passe-bas)
    riverRef.current = new Howl({
      src: ['/sounds/river.mp3'],
      loop: true,
      volume: 0.7,
      rate: 1.0,
      html5: false,
      preload: true,
    });

    // 🐦 Oiseaux de forêt (disparaissent avec le stress)
    birdsRef.current = new Howl({
      src: ['/sounds/birds.wav'],
      loop: true,
      volume: 0.5,
      rate: 1.0,
      html5: true,
      preload: true,
    });

    // 🫁 Suffoquement grave
    breathRef.current = new Howl({
      src: ['/sounds/breathing.mp3'],
      loop: true,
      volume: 0,
      rate: 0.55,
      html5: true,
      preload: true,
    });

    // 💓 Battement de cœur — très présent
    heartRef.current = new Howl({
      src: ['/sounds/heartbeat.mp3'],
      loop: true,
      volume: 0,
      rate: 0.5,
      html5: true,
      preload: true,
    });

    // Démarrage au premier clic/touche
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    // ─── Cleanup propre ───
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);

      riverRef.current?.unload();
      birdsRef.current?.unload();
      breathRef.current?.unload();
      heartRef.current?.unload();

      try {
        oscRef.current?.stop();
        lfoRef.current?.stop();
        audioCtxRef.current?.close();
      } catch {
        // Silencieux si déjà fermé
      }

      audioStarted.current = false;
    };
  }, [initAudio]);

  // Composant invisible — pas de rendu visuel
  return null;
}
