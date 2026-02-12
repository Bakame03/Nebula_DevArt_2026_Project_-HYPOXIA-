"use client";
import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { useStore } from '@/store/useStore';

// ============================================================
// 🫁 SoundManager — L'Angoisse Sonore d'HYPOXIA
// ============================================================
// Transition sonore immersive : NATURE → HORREUR
//
// Stress 0.0-0.3 : 🌿 Nature paisible (oiseaux, rivière)
// Stress 0.3-0.6 : 🟡 Nature se dégrade + respiration apparaît
// Stress 0.6-0.9 : 🔴 Nature meurt, respiration rapide, cœur
// Stress 0.9-1.0 : 💀 Silence mortel, respiration paniquée, drone
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
  const natureRef = useRef<Howl | null>(null);     // 🌿 Nature paisible
  const breathRef = useRef<Howl | null>(null);     // 🫁 Respiration
  const heartRef = useRef<Howl | null>(null);      // 💓 Battement de cœur

  // ─── Refs pour le drone Web Audio API ─────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  // ─── Valeurs lerpées pour transitions douces ──────────────
  const currentNatureVol = useRef(0.6);    // Nature commence audible
  const currentNatureRate = useRef(1.0);   // Rate normal
  const currentBreathVol = useRef(0.0);    // Respiration muette au début
  const currentBreathRate = useRef(1.0);
  const currentHeartVol = useRef(0.0);     // Cœur muet au début
  const currentHeartRate = useRef(0.8);
  const currentDroneGain = useRef(0.0);    // Drone muet au début

  const rafRef = useRef<number | null>(null);
  const stressRef = useRef(stressLevel);
  stressRef.current = stressLevel;
  const audioStarted = useRef(false);

  // ─── Initialisation audio au premier clic ─────────────────
  const initAudio = useCallback(() => {
    if (audioStarted.current) return;
    audioStarted.current = true;

    // 🌿 Lancer la nature (fort et clair)
    if (natureRef.current) {
      natureRef.current.play();
    }

    // 🫁 Lancer la respiration (muette, prête à monter)
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
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Oscillateur principal — grondement subsonique
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 40;

      // Gain principal
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gainRef.current = gain;

      // LFO pour pulsation/tremolo angoissante
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.3;
      lfoRef.current = lfo;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0;
      lfoGainRef.current = lfoGain;

      // Connexions
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

    // Démarrer la boucle de mise à jour
    startUpdateLoop();
  }, []);

  // ─── Boucle de mise à jour (requestAnimationFrame) ────────
  const startUpdateLoop = useCallback(() => {
    const update = () => {
      const stress = stressRef.current;
      const lerpSpeed = 0.06; // Transition douce

      // ════════════════════════════════════════════════════════
      // 🌿 COUCHE 1 : NATURE (disparaît avec le stress)
      // ════════════════════════════════════════════════════════
      // Volume : 0.6 (paisible) → 0.0 (mort) 
      // Rate : 1.0 → 0.5 (ralentit, comme si la nature meurt)
      const natureVolTarget = clamp(0.6 - (stress * 0.8), 0, 0.6);
      const natureRateTarget = clamp(1.0 - (stress * 0.5), 0.5, 1.0);

      currentNatureVol.current = lerp(currentNatureVol.current, natureVolTarget, lerpSpeed);
      currentNatureRate.current = lerp(currentNatureRate.current, natureRateTarget, lerpSpeed);

      if (natureRef.current) {
        natureRef.current.volume(currentNatureVol.current);
        natureRef.current.rate(currentNatureRate.current);
      }

      // ════════════════════════════════════════════════════════
      // 🫁 COUCHE 2 : RESPIRATION (apparaît dès 20% de stress)
      // ════════════════════════════════════════════════════════
      // Commence doucement, puis accélère brutalement
      const breathStress = clamp((stress - 0.2) / 0.8, 0, 1); // Normalise 0.2-1.0 → 0-1
      const breathVolTarget = breathStress * breathStress * 0.9; // Montée exponentielle
      const breathRateTarget = 1.0 + (breathStress * breathStress * 1.5); // 1.0 → 2.5

      currentBreathVol.current = lerp(currentBreathVol.current, breathVolTarget, lerpSpeed);
      currentBreathRate.current = lerp(currentBreathRate.current, breathRateTarget, lerpSpeed);

      if (breathRef.current) {
        breathRef.current.volume(currentBreathVol.current);
        breathRef.current.rate(currentBreathRate.current);
      }

      // ════════════════════════════════════════════════════════
      // 💓 COUCHE 3 : BATTEMENT DE CŒUR (apparaît dès 40%)
      // ════════════════════════════════════════════════════════
      const heartStress = clamp((stress - 0.4) / 0.6, 0, 1); // Normalise 0.4-1.0 → 0-1
      const heartVolTarget = heartStress * 0.7;
      const heartRateTarget = 0.8 + heartStress * 1.2; // 0.8 → 2.0

      currentHeartVol.current = lerp(currentHeartVol.current, heartVolTarget, lerpSpeed);
      currentHeartRate.current = lerp(currentHeartRate.current, heartRateTarget, lerpSpeed);

      if (heartRef.current) {
        heartRef.current.volume(currentHeartVol.current);
        heartRef.current.rate(currentHeartRate.current);
      }

      // ════════════════════════════════════════════════════════
      // 🌊 COUCHE 4 : DRONE HORRIBLE (apparaît dès 50%)
      // ════════════════════════════════════════════════════════
      const droneStress = clamp((stress - 0.5) / 0.5, 0, 1); // Normalise 0.5-1.0 → 0-1
      const droneGainTarget = droneStress * droneStress * 0.18;

      currentDroneGain.current = lerp(currentDroneGain.current, droneGainTarget, lerpSpeed * 0.5);

      if (gainRef.current) {
        gainRef.current.gain.value = currentDroneGain.current;
      }

      // Fréquence monte (40Hz → 90Hz) — de plus en plus oppressant
      if (oscRef.current) {
        oscRef.current.frequency.value = 40 + droneStress * 50;
      }

      // Tremolo s'intensifie (pulsation angoissante)
      if (lfoRef.current && lfoGainRef.current) {
        lfoRef.current.frequency.value = 0.3 + droneStress * 6; // Pulsation rapide
        lfoGainRef.current.gain.value = droneStress * 0.1;
      }

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
  }, []);

  // ─── Effet principal : Chargement / Déchargement ──────────
  useEffect(() => {
    // 🌿 Nature : atmosphère paisible en boucle
    natureRef.current = new Howl({
      src: ['/sounds/nature.mp3'],
      loop: true,
      volume: 0.6,
      rate: 1.0,
      html5: true,
      preload: true,
    });

    // 🫁 Respiration : monte avec le stress
    breathRef.current = new Howl({
      src: ['/sounds/breathing.mp3'],
      loop: true,
      volume: 0,
      rate: 1.0,
      html5: true,
      preload: true,
    });

    // 💓 Battement de cœur : s'active à mi-stress
    heartRef.current = new Howl({
      src: ['/sounds/heartbeat.mp3'],
      loop: true,
      volume: 0,
      rate: 0.8,
      html5: true,
      preload: true,
    });

    // Démarrage au premier clic/touche (politique autoplay navigateurs)
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

      natureRef.current?.unload();
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
