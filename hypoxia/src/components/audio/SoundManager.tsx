"use client";
import { useEffect, useRef, useCallback } from 'react';
import { Howl, Howler } from 'howler';
import { useStore } from '@/store/useStore';

// ============================================================
// 🫁 SoundManager — L'Angoisse Sonore d'HYPOXIA
// ============================================================
// 🔇 DEBUG : Phase 4 - RIVIÈRE + OISEAUX + NOUVEAU CŒUR LOURD
// Stress 0.0-1.0 : Rivière et Oiseaux diminuent.
// Stress 0.1-1.0 : Cœur Lourd augmente (Boum Boum).
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
  const heartRef = useRef<Howl | null>(null);      // 💓 Cœur Lourd (Nouveau)

  // ─── Refs pour le filtre passe-bas sur le fleuve ──────────
  const riverFilterRef = useRef<BiquadFilterNode | null>(null);
  const riverGainRef = useRef<GainNode | null>(null);

  // ─── Valeurs lerpées pour transitions douces ──────────────
  const currentRiverVol = useRef(0.7);       // Fleuve fort
  const currentRiverFilter = useRef(2200);   // Filtre ouvert (Hz)
  const currentBirdsVol = useRef(0.5);       // Oiseaux audibles
  const currentHeartVol = useRef(0.0);       // Cœur muet
  const currentHeartRate = useRef(0.8);      // Rate lourd (plus lent au début)

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

        // @ts-ignore
        const soundIds = riverRef.current._sounds;
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

    // 💓 Lancer le nouveau cœur (muet au début)
    if (heartRef.current) {
      heartRef.current.volume(0);
      heartRef.current.play();
    }

    startUpdateLoop();
  }, []);

  // ─── Boucle de mise à jour (requestAnimationFrame) ────────
  const startUpdateLoop = useCallback(() => {
    const update = () => {
      const stress = stressRef.current;
      const lerpSpeed = 0.05;

      // ════════════════════════════════════════════════════════
      // 🌊 COUCHE 1 : FLEUVE (Phase 2 : Diminue avec le stress)
      // ════════════════════════════════════════════════════════
      const riverVolTarget = clamp(0.7 * (1 - stress), 0, 0.7);
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
      // 🐦 COUCHE 2 : OISEAUX (Phase 2 : Synchro avec le fleuve)
      // ════════════════════════════════════════════════════════
      const birdsVolTarget = clamp(0.5 * (1 - stress), 0, 0.5);
      currentBirdsVol.current = lerp(currentBirdsVol.current, birdsVolTarget, lerpSpeed);

      if (birdsRef.current) {
        birdsRef.current.volume(currentBirdsVol.current);
        birdsRef.current.rate(1.0);
      }

      // ════════════════════════════════════════════════════════
      // 💓 COUCHE 3 : NOUVEAU CŒUR LOURD (Phase 4)
      // ════════════════════════════════════════════════════════
      // Apparaît dès 0.1 de stress.
      // Monte en puissance de manière très lourde.
      const heartStress = clamp((stress - 0.1) / 0.9, 0, 1); // 0 à 1
      const heartVolTarget = heartStress * heartStress * 1.0; // Courbe exponentielle

      // Rate : 0.8 (lourd) -> 1.5 (rapide mais pas ridicule)
      const heartRateTarget = 0.8 + heartStress * 0.7;

      currentHeartVol.current = lerp(currentHeartVol.current, heartVolTarget, lerpSpeed);
      currentHeartRate.current = lerp(currentHeartRate.current, heartRateTarget, lerpSpeed);

      if (heartRef.current) {
        heartRef.current.volume(currentHeartVol.current);
        heartRef.current.rate(currentHeartRate.current);
      }

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
  }, []);

  // ─── Effet principal : Chargement / Déchargement ──────────
  useEffect(() => {
    // 🌊 Fleuve
    riverRef.current = new Howl({
      src: ['/sounds/river.mp3'],
      loop: true,
      volume: 0.7,
      rate: 1.0,
      html5: false,
      preload: true,
    });

    // 🐦 Oiseaux
    birdsRef.current = new Howl({
      src: ['/sounds/birds.wav'],
      loop: true,
      volume: 0.5,
      rate: 1.0,
      html5: true,
      preload: true,
    });

    // 💓 Nouveau Cœur (Lourd)
    heartRef.current = new Howl({
      src: ['/sounds/heartbeat_heavy.mp3'], // Nouveau fichier
      loop: true,
      volume: 0,
      rate: 0.8,
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

    // TENTATIVE D'AUTO-PLAY (Si le navigateur le permet)
    initAudio();

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
      heartRef.current?.unload();

      audioStarted.current = false;
    };
  }, [initAudio]);

  return null;
}
