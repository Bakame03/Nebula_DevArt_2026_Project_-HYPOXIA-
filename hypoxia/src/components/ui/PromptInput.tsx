"use client";

import { useRef, useCallback, useMemo } from "react";
import type { Variants } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

// ─── Animation Variants ──────────────────────────────────────────────────────

const shakeVariants: Variants = {
  idle: { x: 0, rotate: 0 },
  shake: {
    x: [0, -3, 5, -6, 4, -2, 3, 0],
    rotate: [0, -0.2, 0.3, -0.15, 0.2, 0],
    transition: {
      duration: 0.3,
      repeat: Infinity,
      repeatType: "mirror" as const,
    },
  },
};

const glitchVariants: Variants = {
  idle: { scale: 1, opacity: 1 },
  glitch: {
    scale: [1, 1.15, 0.9, 1.05, 1],
    opacity: [1, 0.4, 1, 0.6, 1],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      repeatType: "mirror" as const,
    },
  },
};

const alertVariants: Variants = {
  initial: { opacity: 0, scale: 0.7, filter: "blur(20px)" },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    filter: "blur(14px)",
    transition: { duration: 0.25 },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBarColor(corruption: number): string {
  if (corruption > 0.9) return "#ff0040";
  if (corruption > 0.7) return "#ff4040";
  if (corruption > 0.4) return "#ffcc00";
  return "#00ffaa";
}

function getIntegrityTag(corruption: number): string {
  if (corruption > 0.9) return "MELTDOWN";
  if (corruption > 0.7) return "CRITICAL";
  if (corruption > 0.4) return "UNSTABLE";
  return "NOMINAL";
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function PlusIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 4v12M4 10h12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowUpIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 16V4m0 0l-5 5m5-5l5 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PromptInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const promptText = useStore((s) => s.promptText);
  const stressLevel = useStore((s) => s.stressLevel);
  const permanentDamage = useStore((s) => s.permanentDamage);
  const maxChars = useStore((s) => s.maxChars);
  const setPrompt = useStore((s) => s.setPrompt);

  const corruption = useMemo(
    () => Math.min(stressLevel + permanentDamage, 1),
    [stressLevel, permanentDamage],
  );

  const integrity = Math.max(1 - corruption, 0);
  const charCount = promptText.length;
  const barColor = getBarColor(corruption);
  const isCritical = corruption > 0.7;
  const isMeltdown = corruption > 0.9;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length <= maxChars) {
        setPrompt(e.target.value);
      }
    },
    [maxChars, setPrompt],
  );

  // Dynamic styles based on corruption
  const borderColor = isCritical
    ? `rgba(255, 0, 64, ${0.3 + corruption * 0.4})`
    : "rgba(255, 255, 255, 0.20)";

  const boxShadow = isCritical
    ? `0 0 60px rgba(255,0,64,${corruption * 0.2}), 0 0 120px rgba(255,0,64,${corruption * 0.08}), inset 0 0 30px rgba(255,0,64,0.03)`
    : "0 0 40px rgba(0,0,0,0.3)";

  const btnColor = isCritical ? "#ff0040" : "rgba(255,255,255,0.5)";
  const btnBg = isCritical
    ? "rgba(255,0,64,0.12)"
    : "rgba(255,255,255,0.08)";

  return (
    <>
      {/* ── Full-screen overlay — pointer-events: none ─────────────────── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">

        {/* ── Ambient red glow when critical ──────────────────────────── */}
        <AnimatePresence>
          {isCritical && (
            <motion.div
              key="ambient-glow"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255,0,64,0.06) 0%, transparent 70%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Centered Capsule Bar — pointer-events: auto ─────────────── */}
        <motion.div
          className="pointer-events-auto w-[92%] max-w-2xl flex flex-col items-center"
          variants={shakeVariants}
          animate={isCritical ? "shake" : "idle"}
        >
          {/* ── SYSTEM INTEGRITY bar ──────────────────────────────────── */}
          <div className="w-full max-w-md mb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.25em]"
                style={{ color: barColor }}
              >
                System Integrity
              </span>
              <motion.span
                className="font-mono text-[9px] font-bold uppercase tracking-wider"
                style={{ color: barColor }}
                animate={
                  isMeltdown
                    ? { opacity: [1, 0.3, 1] }
                    : { opacity: 1 }
                }
                transition={
                  isMeltdown
                    ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" as const }
                    : {}
                }
              >
                {getIntegrityTag(corruption)}
              </motion.span>
            </div>
            <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: barColor,
                  boxShadow: `0 0 8px ${barColor}80`,
                }}
                animate={{ width: `${integrity * 100}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
              />
            </div>
          </div>

          {/* ── Liquid Glass Capsule ──────────────────────────────────── */}
          <div
            className="relative flex w-full items-center gap-2 rounded-full border px-2 py-2"
            style={{
              background: isCritical
                ? "rgba(255, 0, 64, 0.05)"
                : "rgba(255, 255, 255, 0.10)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              borderColor,
              boxShadow,
              transition:
                "background 0.5s ease, border-color 0.4s ease, box-shadow 0.5s ease",
            }}
          >
            {/* ── + Button ────────────────────────────────────────────── */}
            <motion.button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors"
              style={{
                borderColor: isCritical
                  ? "rgba(255,0,64,0.3)"
                  : "rgba(255,255,255,0.12)",
                backgroundColor: btnBg,
              }}
              variants={glitchVariants}
              animate={isMeltdown ? "glitch" : "idle"}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label="Ajouter un fichier"
            >
              <PlusIcon color={btnColor} />
            </motion.button>

            {/* ── Text Input ──────────────────────────────────────────── */}
            <input
              ref={inputRef}
              type="text"
              value={promptText}
              onChange={handleChange}
              maxLength={maxChars}
              placeholder="Tape ici... le système respire encore."
              spellCheck={false}
              autoFocus
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-[15px] font-medium tracking-wide text-white outline-none placeholder:text-white/25"
              style={{
                color: isCritical ? "#ff3060" : "#ffffff",
                filter: isCritical ? "blur(0.6px)" : "none",
                textShadow: isCritical
                  ? "0 0 6px rgba(255,0,64,0.4)"
                  : "none",
                transition:
                  "color 0.3s ease, filter 0.3s ease, text-shadow 0.3s ease",
              }}
            />

            {/* ── Send Button ─────────────────────────────────────────── */}
            <motion.button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors"
              style={{
                backgroundColor: isCritical
                  ? "rgba(255,0,64,0.2)"
                  : "rgba(255,255,255,0.12)",
              }}
              variants={glitchVariants}
              animate={isMeltdown ? "glitch" : "idle"}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label="Envoyer"
            >
              <ArrowUpIcon color={btnColor} />
            </motion.button>
          </div>

          {/* ── Meta Row: Écho + Token Counter ────────────────────────── */}
          <div className="mt-2 flex w-full max-w-md items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25">
                Écho
              </span>
              <span
                className="font-mono text-[10px] font-bold tabular-nums"
                style={{
                  color:
                    permanentDamage > 0
                      ? "#ff0040"
                      : "rgba(255,255,255,0.18)",
                }}
              >
                {(permanentDamage * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className="font-mono text-[11px] font-bold tabular-nums tracking-wider"
                style={{ color: barColor }}
              >
                {String(charCount).padStart(3, "0")}
              </span>
              <span className="font-mono text-[11px] text-white/20">
                / {maxChars}
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-white/15">
                Tokens
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── OXYGEN CRITICAL — Full-screen Jumpscare ───────────────────── */}
      <AnimatePresence>
        {isMeltdown && (
          <motion.div
            key="oxygen-critical"
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center pointer-events-none"
            variants={alertVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Red vignette */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 20%, rgba(255,0,64,0.15) 100%)",
              }}
            />

            {/* Glitch scanline */}
            <motion.div
              className="absolute left-0 right-0 h-px"
              style={{ backgroundColor: "rgba(255,0,64,0.4)" }}
              animate={{ top: ["8%", "92%", "8%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            />

            {/* Warning text */}
            <div className="relative select-none text-center">
              <motion.p
                className="text-6xl font-black tracking-widest md:text-8xl"
                style={{
                  color: "#ff0040",
                  textShadow:
                    "0 0 40px rgba(255,0,64,0.9), 0 0 80px rgba(255,0,64,0.35), 0 0 160px rgba(255,0,64,0.12)",
                }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 0.1, repeat: Infinity }}
              >
                ⚠
              </motion.p>
              <p
                className="mt-3 font-mono text-sm font-bold uppercase tracking-[0.35em] md:text-base"
                style={{
                  color: "#ff0040",
                  textShadow: "0 0 20px rgba(255,0,64,0.6)",
                }}
              >
                Oxygen Critical
              </p>
              <motion.p
                className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.45em] text-white/30"
                animate={{ opacity: [0.2, 0.7, 0.2] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                System collapse imminent
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}