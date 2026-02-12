"use client";
import { useEffect, useRef, useCallback } from 'react';
import { Howl, Howler } from 'howler';
import { useStore } from '@/store/useStore';

// ============================================================
// 🫁 SoundManager — L'Angoisse Sonore d'HYPOXIA
// ============================================================
// Transition sonore immersive : FLEUVE → SUFFOCATION
//
// Stress 0.0-0.2 : � Fleuve vivant, eau claire qui coule
// Stress 0.2-0.5 : 🟡 Fleuve s'atténue, suffoquement grave apparaît
// Stress 0.5-0.8 : 🔴 Fleuve étouffé (filtre passe-bas), cœur s'accélère
// Stress 0.8-1.0 : 💀 Fleuve mort, suffoquement lourd, tachycardie, drone
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
  const riverRef = useRef<Howl | null>(null);      // � Fleuve
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
  const currentRiverVol = useRef(0.7);       // Fleuve commence fort
  const currentRiverFilter = useRef(2200);   // Filtre ouvert (Hz)
  const currentBreathVol = useRef(0.0);      // Suffoquement muet au début
  const currentBreathRate = useRef(0.6);     // Rate grave
  const currentHeartVol = useRef(0.0);       // Cœur muet au début
  const currentHeartRate = useRef(0.6);      // Rate lent
  const currentDroneGain = useRef(0.0);      // Drone muet au début

  const rafRef = useRef<number | null>(null);
  const stressRef = useRef(stressLevel);
  stressRef.current = stressLevel;
  const audioStarted = useRef(false);

  // ─── Initialisation audio au premier clic ─────────────────
  const initAudio = useCallback(() => {
    if (audioStarted.current) return;
    audioStarted.current = true;

    // � Brancher le filtre passe-bas sur le fleuve via Web Audio
    try {
      const ctx = Howler.ctx;
      if (ctx && riverRef.current) {
        // Créer le filtre passe-bas
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2200; // Complètement ouvert au début
        filter.Q.value = 0.7; // Résonance douce
        riverFilterRef.current = filter;

        // Gain node dédié au fleuve
        const riverGain = ctx.createGain();
        riverGain.gain.value = 0.7;
        riverGainRef.current = riverGain;

        // Récupérer le nœud audio interne de Howler
        // Howler en mode Web Audio connecte ses sons via masterGain
        // On insère notre filtre entre le son et la sortie
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
      const lerpSpeed = 0.05; // Transition douce

      // ════════════════════════════════════════════════════════
      // � COUCHE 1 : FLEUVE (disparaît avec le stress)
      // ════════════════════════════════════════════════════════
      // Volume : 0.7 (eau vivante) → 0.0 (asséché)
      // Filtre passe-bas : 2200 Hz (clair) → 150 Hz (étouffé/mort)
      // Synchronisé avec River.tsx : waterHeight = 4.0 * (1 - stress)
      const riverVolTarget = clamp(0.7 * (1 - stress * 1.3), 0, 0.7);
      const riverFilterTarget = clamp(2200 - (stress * 2050), 150, 2200);

      currentRiverVol.current = lerp(currentRiverVol.current, riverVolTarget, lerpSpeed);
      currentRiverFilter.current = lerp(currentRiverFilter.current, riverFilterTarget, lerpSpeed);

      // Appliquer le volume via le gain node dédié
      if (riverGainRef.current) {
        riverGainRef.current.gain.value = currentRiverVol.current;
      } else if (riverRef.current) {
        // Fallback si le filtre n'a pas pu être branché
        riverRef.current.volume(currentRiverVol.current);
      }

      // Appliquer le filtre passe-bas
      if (riverFilterRef.current) {
        riverFilterRef.current.frequency.value = currentRiverFilter.current;
      }

      // ════════════════════════════════════════════════════════
      // 🫁 COUCHE 2 : SUFFOQUEMENT GRAVE (apparaît dès 15%)
      // ════════════════════════════════════════════════════════
      // Pitch grave et lourd — comme quelqu'un qui manque d'air
      // Rate : 0.6 (grave) → 0.4 (encore plus grave, agonisant)
      // Volume : montée cubique pour effet viscéral
      const breathStress = clamp((stress - 0.15) / 0.85, 0, 1);
      const breathVolTarget = breathStress * breathStress * breathStress * 0.95; // Cubique
      const breathRateTarget = 0.6 - (breathStress * 0.2); // 0.6 → 0.4 (de plus en plus grave)

      currentBreathVol.current = lerp(currentBreathVol.current, breathVolTarget, lerpSpeed);
      currentBreathRate.current = lerp(currentBreathRate.current, breathRateTarget, lerpSpeed);

      if (breathRef.current) {
        breathRef.current.volume(currentBreathVol.current);
        breathRef.current.rate(currentBreathRate.current);
      }

      // ════════════════════════════════════════════════════════
      // 💓 COUCHE 3 : BATTEMENT DE CŒUR (apparaît dès 30%)
      // ════════════════════════════════════════════════════════
      // De calme à tachycardie paniquée
      // Rate : 0.6 (lent) → 2.5 (tachycardie)
      // Volume max : 0.85 — très présent à haut stress
      const heartStress = clamp((stress - 0.3) / 0.7, 0, 1);
      const heartVolTarget = heartStress * heartStress * heartStress * 0.85; // Cubique
      const heartRateTarget = 0.6 + heartStress * heartStress * 1.9; // 0.6 → 2.5 (accélération soudaine)

      currentHeartVol.current = lerp(currentHeartVol.current, heartVolTarget, lerpSpeed);
      currentHeartRate.current = lerp(currentHeartRate.current, heartRateTarget, lerpSpeed);

      if (heartRef.current) {
        heartRef.current.volume(currentHeartVol.current);
        heartRef.current.rate(currentHeartRate.current);
      }

      // ════════════════════════════════════════════════════════
      // 🌊 COUCHE 4 : DRONE HORRIBLE (apparaît dès 50%)
      // ════════════════════════════════════════════════════════
      const droneStress = clamp((stress - 0.5) / 0.5, 0, 1);
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
        lfoRef.current.frequency.value = 0.3 + droneStress * 6;
        lfoGainRef.current.gain.value = droneStress * 0.1;
      }

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
  }, []);

  // ─── Effet principal : Chargement / Déchargement ──────────
  useEffect(() => {
    // � Fleuve : écoulement d'eau en boucle
    // html5: false pour pouvoir utiliser Web Audio API (filtre passe-bas)
    riverRef.current = new Howl({
      src: ['/sounds/river.mp3'],
      loop: true,
      volume: 0.7,
      rate: 1.0,
      html5: false, // Web Audio mode pour le filtre
      preload: true,
    });

    // 🫁 Suffoquement grave : respiration lourde pitch bas
    breathRef.current = new Howl({
      src: ['/sounds/breathing.mp3'],
      loop: true,
      volume: 0,
      rate: 0.6, // Pitch grave dès le départ
      html5: true,
      preload: true,
    });

    // 💓 Battement de cœur : s'active rapidement
    heartRef.current = new Howl({
      src: ['/sounds/heartbeat.mp3'],
      loop: true,
      volume: 0,
      rate: 0.6, // Commence lent
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

      riverRef.current?.unload();
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
