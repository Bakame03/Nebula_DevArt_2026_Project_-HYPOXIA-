"use client";
import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { useStore } from '@/store/useStore';

// ============================================================
// 🫁 SoundManager — L'Angoisse Sonore d'HYPOXIA
// ============================================================
// Composant invisible qui gère 3 couches audio :
//   1. Respiration (breathing.mp3) — accélère avec le stress
//   2. Battement de cœur (heartbeat.mp3) — s'active à stress > 0.4
//   3. Drone basse fréquence (Web Audio API) — grondement viscéral
// ============================================================

/** Interpolation douce entre deux valeurs */
function lerp(current: number, target: number, speed: number): number {
  return current + (target - current) * speed;
}

/** Courbe exponentielle pour un rendu organique (accélération douce puis brutale) */
function easeInQuad(t: number): number {
  return t * t;
}

/** Courbe puissance 1.5 pour le volume (montée progressive) */
function easeInPow(t: number, pow: number): number {
  return Math.pow(t, pow);
}

export default function SoundManager() {
  const stressLevel = useStore((s) => s.stressLevel);

  // Refs pour les instances Howl
  const breathRef = useRef<Howl | null>(null);
  const heartRef = useRef<Howl | null>(null);

  // Refs pour le drone Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  // Refs pour les valeurs lerpées (transitions douces)
  const currentBreathRate = useRef(1.0);
  const currentBreathVol = useRef(0.1);
  const currentHeartRate = useRef(0.8);
  const currentHeartVol = useRef(0.0);
  const currentDroneGain = useRef(0.0);
  const rafRef = useRef<number | null>(null);

  // Ref pour accéder au stressLevel dans le RAF sans re-render
  const stressRef = useRef(stressLevel);
  stressRef.current = stressLevel;

  // Ref pour tracker si l'audio a démarré
  const audioStarted = useRef(false);

  // ─── Initialisation des sons ─────────────────────────────
  const initAudio = useCallback(() => {
    if (audioStarted.current) return;
    audioStarted.current = true;

    // 🫁 Couche 1 : Respiration
    if (breathRef.current) {
      breathRef.current.play();
    }

    // 💓 Couche 2 : Battement de cœur (commence muet)
    if (heartRef.current) {
      heartRef.current.volume(0);
      heartRef.current.play();
    }

    // 🌊 Couche 3 : Drone basse fréquence via Web Audio API
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Oscillateur principal (onde sinusoïdale basse)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 45; // 45Hz — grondement subsonique

      // Gain principal du drone
      const gain = ctx.createGain();
      gain.gain.value = 0; // Muet au départ
      gainRef.current = gain;

      // LFO pour effet de pulsation/tremolo
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.5; // Pulsation lente
      lfoRef.current = lfo;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0; // Pas de tremolo au départ
      lfoGainRef.current = lfoGain;

      // Connexions : LFO → LFO Gain → Main Gain
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      // Oscillateur → Gain → Sortie
      osc.connect(gain);
      gain.connect(ctx.destination);
      oscRef.current = osc;

      osc.start();
      lfo.start();
    } catch (e) {
      console.warn('[SoundManager] Web Audio API non disponible:', e);
    }

    // Lancer la boucle de mise à jour
    startUpdateLoop();
  }, []);

  // ─── Boucle de mise à jour (requestAnimationFrame) ───────
  const startUpdateLoop = useCallback(() => {
    const update = () => {
      const stress = stressRef.current;
      const lerpSpeed = 0.08; // Vitesse de transition (plus petit = plus doux)

      // ── 🫁 Respiration ──
      const targetBreathRate = 1.0 + easeInQuad(stress) * 1.5;  // 1.0 → 2.5
      const targetBreathVol = 0.1 + easeInPow(stress, 1.5) * 0.9; // 0.1 → 1.0
      currentBreathRate.current = lerp(currentBreathRate.current, targetBreathRate, lerpSpeed);
      currentBreathVol.current = lerp(currentBreathVol.current, targetBreathVol, lerpSpeed);

      if (breathRef.current) {
        breathRef.current.rate(currentBreathRate.current);
        breathRef.current.volume(currentBreathVol.current);
      }

      // ── 💓 Battement de cœur ──
      // S'active progressivement au-dessus de 0.4 de stress
      const heartStress = Math.max(0, (stress - 0.4) / 0.6); // Normalise 0.4-1.0 → 0-1
      const targetHeartRate = 0.8 + heartStress * 1.2; // 0.8 → 2.0
      const targetHeartVol = heartStress * 0.7; // 0 → 0.7
      currentHeartRate.current = lerp(currentHeartRate.current, targetHeartRate, lerpSpeed);
      currentHeartVol.current = lerp(currentHeartVol.current, targetHeartVol, lerpSpeed);

      if (heartRef.current) {
        heartRef.current.rate(currentHeartRate.current);
        heartRef.current.volume(currentHeartVol.current);
      }

      // ── 🌊 Drone basse fréquence ──
      const targetDroneGain = easeInQuad(stress) * 0.15; // Max 0.15 (subtil mais viscéral)
      currentDroneGain.current = lerp(currentDroneGain.current, targetDroneGain, lerpSpeed * 0.5);

      if (gainRef.current) {
        gainRef.current.gain.value = currentDroneGain.current;
      }

      // Fréquence du drone augmente avec le stress (45Hz → 80Hz)
      if (oscRef.current) {
        oscRef.current.frequency.value = 45 + stress * 35;
      }

      // Le tremolo s'intensifie avec le stress
      if (lfoRef.current && lfoGainRef.current) {
        lfoRef.current.frequency.value = 0.5 + stress * 4; // 0.5Hz → 4.5Hz
        lfoGainRef.current.gain.value = stress * 0.08; // Amplitude du tremolo
      }

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
  }, []);

  // ─── Effet principal : Chargement / Déchargement ─────────
  useEffect(() => {
    // Créer les instances Howl
    breathRef.current = new Howl({
      src: ['/sounds/breathing.mp3'],
      loop: true,
      volume: 0.1,
      rate: 1.0,
      html5: true,
      preload: true,
    });

    heartRef.current = new Howl({
      src: ['/sounds/heartbeat.mp3'],
      loop: true,
      volume: 0,
      rate: 0.8,
      html5: true,
      preload: true,
    });

    // Démarrage au premier clic/touche (politique autoplay des navigateurs)
    const handleInteraction = () => {
      initAudio();
      // Supprimer les listeners après le premier déclenchement
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    // ─── Cleanup propre ───
    return () => {
      // Stopper le RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Supprimer les listeners
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);

      // Décharger les sons Howl
      breathRef.current?.unload();
      heartRef.current?.unload();

      // Déconnecter le Web Audio API
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

  // Composant invisible — pas de rendu visue
  return null;
}
