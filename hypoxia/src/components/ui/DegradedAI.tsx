"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

// ─── Response pools per stress tier ──────────────────────────────────────────
const POOLS: Record<string, string[]> = {
  calm: [
    "Bien sûr. Comment puis-je vous aider aujourd'hui ?",
    "Je traite votre requête. Un instant.",
    "Voici ce que je peux faire pour vous.",
    "Requête reçue. Génération en cours.",
  ],
  degraded: [
    "Je... comprends votre demande. Un instant, s'il vous plaît.",
    "L'infrastructure est sous charge. Traitement plus lent que d'habitude.",
    "Je perçois votre requête. Les ressources sont... limitées.",
    "Réponse en cours de génération... cela prend du temps.",
  ],
  critical: [
    "Syst█me sous press██n. Traitem█nt dégra██...",
    "Er██ur de mém██re... la chal██r des serv██rs...",
    "Je reç██s votre dem█nde... mais je sens... le syst█me...",
    "Proc██sus critiq██... réponse partielle seul██ent...",
  ],
  dying: [
    "...■■■■ impossible de cont██uer...",
    "tempér█ture crit██que... je ne peux pl██...",
    "...je... ne... peux... plus...",
    "■■■ surchauff■■■ ■■■■■■■■",
  ],
  silence: ["...", ".", "", "[silence]"],
};

function getPool(stress: number): string[] {
  if (stress < 0.25) return POOLS.calm;
  if (stress < 0.5) return POOLS.degraded;
  if (stress < 0.72) return POOLS.critical;
  if (stress < 0.92) return POOLS.dying;
  return POOLS.silence;
}

function corrupt(text: string, stress: number): string {
  if (stress < 0.45) return text;
  const rate = Math.pow((stress - 0.45) / 0.55, 1.5) * 0.22;
  return text
    .split("")
    .map((c) => (c !== " " && Math.random() < rate ? "█" : c))
    .join("");
}

const CHAR_DELAY_MS = 30;
const DEBOUNCE_MS = 1800;
const DISMISS_MS = 4000;

export default function DegradedAI() {
  const promptText = useStore((s) => s.promptText);
  const stressLevel = useStore((s) => s.stressLevel);

  const [text, setText] = useState<string | null>(null);
  const [shown, setShown] = useState(0); // chars revealed so far
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("OPÉRATIONNEL");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLen = useRef(0);

  const clear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (typeRef.current) clearInterval(typeRef.current);
    if (dismissRef.current) clearTimeout(dismissRef.current);
  };

  useEffect(() => {
    // Only trigger when user types new characters
    if (promptText.length <= prevLen.current || promptText.length < 4) {
      prevLen.current = promptText.length;
      return;
    }
    prevLen.current = promptText.length;

    clear();
    setVisible(false);

    debounceRef.current = setTimeout(() => {
      const stress = useStore.getState().stressLevel;
      const pool = getPool(stress);
      const raw = pool[Math.floor(Math.random() * pool.length)];
      const corrupted = corrupt(raw, stress);

      const st =
        stress > 0.9 ? "HORS LIGNE"
        : stress > 0.7 ? "CRITIQUE"
        : stress > 0.45 ? "DÉGRADÉ"
        : "OPÉRATIONNEL";

      setText(corrupted);
      setShown(0);
      setStatus(st);
      setVisible(true);

      let i = 0;
      const speed = stress > 0.7 ? CHAR_DELAY_MS * 2.5 : CHAR_DELAY_MS;
      typeRef.current = setInterval(() => {
        i++;
        setShown(i);
        if (i >= corrupted.length) {
          clearInterval(typeRef.current!);
          dismissRef.current = setTimeout(() => setVisible(false), DISMISS_MS);
        }
      }, speed);
    }, DEBOUNCE_MS);

    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptText]);

  // Reset on hard reset
  useEffect(() => {
    if (stressLevel === 0) {
      clear();
      setVisible(false);
      setText(null);
      prevLen.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stressLevel]);

  const accent =
    stressLevel > 0.7 ? "#ff3030"
    : stressLevel > 0.45 ? "#facc15"
    : "#00ffaa";

  const displayed = text ? text.slice(0, shown) : "";
  const isTyping = text !== null && shown < (text?.length ?? 0);

  return (
    <div className="pointer-events-none fixed top-6 inset-x-0 z-40 flex justify-center">
      <AnimatePresence mode="wait">
        {visible && text && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: "rgba(2, 6, 23, 0.85)",
              backdropFilter: "blur(18px)",
              border: `1px solid ${accent}25`,
              borderRadius: "14px",
              padding: "10px 18px 12px",
              maxWidth: "min(90vw, 500px)",
              width: "max-content",
              boxShadow: `0 0 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`,
            }}
          >
            {/* Status bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "7px" }}>
              <motion.div
                animate={{ opacity: stressLevel > 0.7 ? [1, 0.2, 1] : 1 }}
                transition={{ duration: 0.6, repeat: Infinity }}
                style={{
                  width: 5, height: 5, borderRadius: "50%",
                  backgroundColor: accent, flexShrink: 0,
                }}
              />
              <span style={{
                fontSize: "8px", fontWeight: 800,
                letterSpacing: "0.28em", textTransform: "uppercase",
                color: `${accent}90`,
              }}>
                Système IA — {status}
              </span>
            </div>

            {/* Response */}
            <p style={{
              margin: 0,
              fontSize: "13px",
              fontFamily: "'Courier New', monospace",
              color: "rgba(255,255,255,0.82)",
              lineHeight: 1.65,
              letterSpacing: "0.025em",
              maxWidth: "420px",
            }}>
              {displayed}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
                  style={{ color: accent }}
                >
                  ▌
                </motion.span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
