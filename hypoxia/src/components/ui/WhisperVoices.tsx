"use client";

/**
 * WhisperVoices — uses the Web Speech API to whisper human sentences
 * at key stress milestones. No audio files needed.
 *
 * Each sentence is spoken only once per session.
 * At stress ≥ 1.0 (the very end), speech is cancelled — even the voice dies.
 */

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";

const WHISPERS: { threshold: number; text: string }[] = [
  { threshold: 0.35, text: "Je me souviens de l'air propre…" },
  { threshold: 0.55, text: "Mes enfants ne verront jamais ça…" },
  { threshold: 0.75, text: "Pourquoi personne ne fait rien ?" },
  { threshold: 0.90, text: "C'est trop tard, maintenant…" },
];

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.62;   // slow, deliberate
  utterance.pitch = 0.55;  // low pitch → whispery, ghostly
  utterance.volume = 0.55;

  // Use a French voice if available
  const voices = window.speechSynthesis.getVoices();
  const frVoice = voices.find((v) => v.lang.startsWith("fr"));
  if (frVoice) utterance.voice = frVoice;

  window.speechSynthesis.cancel(); // stop any ongoing speech first
  window.speechSynthesis.speak(utterance);
}

export default function WhisperVoices() {
  const stressLevel = useStore((s) => s.stressLevel);
  const spokenRef = useRef<Set<number>>(new Set());

  // Load voices asynchronously (required by some browsers)
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices(); // warm-up
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        window.speechSynthesis.getVoices(); // refresh
      });
    }
  }, []);

  useEffect(() => {
    // At maximum stress: silence — even the whispers stop
    if (stressLevel >= 1.0) {
      window.speechSynthesis?.cancel();
      return;
    }

    // Hard reset: clear spoken set
    if (stressLevel === 0) {
      window.speechSynthesis?.cancel();
      spokenRef.current.clear();
      return;
    }

    // Trigger the first unspoken whisper whose threshold is reached
    for (const w of WHISPERS) {
      if (stressLevel >= w.threshold && !spokenRef.current.has(w.threshold)) {
        spokenRef.current.add(w.threshold);
        speak(w.text);
        break;
      }
    }
  }, [stressLevel]);

  return null;
}
