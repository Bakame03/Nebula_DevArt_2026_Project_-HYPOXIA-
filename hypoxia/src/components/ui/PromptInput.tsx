"use client";

import { useRef, useCallback, useMemo } from "react";
import type { Variants } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

// ─── Animation Variants ──────────────────────────────────────────────────────

const shakeVariants: Variants = {
  idle: { x: 0, rotate: 0 },
  shake: {
    x: [0, -3, 5, -5, 4, -2, 2, 0],
    rotate: [0, -0.3, 0.3, -0.2, 0.2, 0],
    transition: {
      duration: 0.35,
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
    scale: 0.8,
    filter: "blur(16px)",
    transition: { duration: 0.25 },
  },
};

const pulseVariants: Variants = {
  idle: { opacity: 1 },
  critical: {
    opacity: [1, 0.3, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBarColor(corruption: number): string {
  if (corruption > 0.9) return "#ff0040";
  if (corruption > 0.6) return "#ff8c00";
  if (corruption > 0.3) return "#ffcc00";
  return "#00ffaa";
}

function getIntegrityTag(corruption: number): string {
  if (corruption > 0.9) return "MELTDOWN";
  if (corruption > 0.6) return "DEGRADED";
  if (corruption > 0.3) return "UNSTABLE";
  return "NOMINAL";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PromptInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const promptText = useStore((s) => s.promptText);
  const stressLevel = useStore((s) => s.stressLevel);
  const permanentDamage = useStore((s) => s.permanentDamage);
  const maxChars = useStore((s) => s.maxChars);
  const setPrompt = useStore((s) => s.setPrompt);

  // Corruption = sum of immediate stress + permanent scar, capped at 1
  const corruption = useMemo(
    () => Math.min(stressLevel + permanentDamage, 1),
    [stressLevel, permanentDamage],
  );

  const integrity = Math.max(1 - corruption, 0);
  const charCount = promptText.length;
  const barColor = getBarColor(corruption);
  const isCritical = corruption > 0.8;
  const isMeltdown = corruption > 0.9;
  const isOxygenDepleted = corruption > 0.95;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length <= maxChars) {
        setPrompt(e.target.value);
      }
    },
    [maxChars, setPrompt],
  );

  return (
    <>
      {/* ── Ambient vignette that intensifies with corruption ──────────── */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-40"
        animate={{
          background: isMeltdown
            ? "radial-gradient(ellipse at bottom center, rgba(255,0,64,0.12) 0%, transparent 70%)"
            : "radial-gradient(ellipse at bottom center, transparent 0%, transparent 100%)",
        }}
        transition={{ duration: 0.8 }}
      />

      {/* ── Floating Chat Bar ─────────────────────────────────────────── */}
      <motion.div
        className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-3xl -translate-x-1/2"
        variants={shakeVariants}
        animate={isCritical ? "shake" : "idle"}
      >
        {/* ── SYSTEM INTEGRITY bar (above the input) ───────────────────── */}
        <div className="mb-2 px-1">
          <div className="flex items-center justify-between">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.25em]"
              style={{ color: barColor }}
            >
              System Integrity
            </span>
            <motion.span
              className="font-mono text-[9px] font-bold uppercase tracking-wider"
              style={{ color: barColor }}
              variants={pulseVariants}
              animate={isMeltdown ? "critical" : "idle"}
            >
              {getIntegrityTag(corruption)}
            </motion.span>
          </div>

          {/* Progress track */}
          <div className="mt-1 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
              animate={{
                width: `${integrity * 100}%`,
                boxShadow: isMeltdown
                  ? `0 0 12px ${barColor}, 0 0 24px ${barColor}40`
                  : `0 0 6px ${barColor}60`,
              }}
              transition={{ type: "spring", stiffness: 100, damping: 18 }}
            />
          </div>
        </div>

        {/* ── Glass Input Container ────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl border backdrop-blur-xl"
          style={{
            background: "rgba(0, 0, 0, 0.30)",
            borderColor: isMeltdown
              ? "rgba(255, 0, 64, 0.25)"
              : "rgba(255, 255, 255, 0.10)",
            boxShadow: isMeltdown
              ? "0 0 40px rgba(255,0,64,0.08), inset 0 0 30px rgba(255,0,64,0.03)"
              : "0 8px 32px rgba(0,0,0,0.4)",
            transition: "border-color 0.4s ease, box-shadow 0.5s ease",
          }}
        >
          {/* Scanline noise overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-[0.025]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)",
            }}
          />

          {/* Inner layout: textarea + meta row */}
          <div className="relative z-20 flex flex-col gap-2 p-4">
            <textarea
              ref={textareaRef}
              value={promptText}
              onChange={handleChange}
              maxLength={maxChars}
              rows={2}
              placeholder="Commence à taper... le système respire encore."
              spellCheck={false}
              autoFocus
              className="w-full resize-none bg-transparent text-base font-medium leading-relaxed tracking-wide text-white outline-none placeholder:text-white/20"
              style={{
                color: isCritical ? "#ff0040" : "#ffffff",
                filter: isCritical ? "blur(0.8px)" : "none",
                textShadow: isCritical
                  ? "0 0 8px rgba(255,0,64,0.5)"
                  : "none",
                transition:
                  "color 0.3s ease, filter 0.3s ease, text-shadow 0.3s ease",
              }}
            />

            {/* Meta row: Écho + token counter */}
            <div className="flex items-center justify-between">
              {/* Écho indicator */}
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
                        : "rgba(255,255,255,0.20)",
                  }}
                >
                  {(permanentDamage * 100).toFixed(1)}%
                </span>
              </div>

              {/* Token counter */}
              <div className="flex items-center gap-1.5">
                <span
                  className="font-mono text-xs font-bold tabular-nums tracking-wider"
                  style={{ color: barColor }}
                >
                  {String(charCount).padStart(3, "0")}
                </span>
                <span className="font-mono text-xs text-white/25">
                  / {maxChars}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/15">
                  Tokens
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── OXYGEN CRITICAL — Full-screen Alert ───────────────────────── */}
      <AnimatePresence>
        {isOxygenDepleted && (
          <motion.div
            key="oxygen-critical"
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
            variants={alertVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Red vignette */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 20%, rgba(255,0,64,0.18) 100%)",
              }}
            />

            {/* Horizontal glitch scanline */}
            <motion.div
              className="pointer-events-none absolute left-0 right-0 h-px"
              style={{ backgroundColor: "rgba(255,0,64,0.5)" }}
              animate={{ top: ["5%", "95%", "5%"] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Warning content */}
            <div className="relative select-none text-center">
              <motion.p
                className="text-7xl font-black tracking-widest md:text-9xl"
                style={{
                  color: "#ff0040",
                  textShadow:
                    "0 0 40px rgba(255,0,64,0.9), 0 0 80px rgba(255,0,64,0.4), 0 0 160px rgba(255,0,64,0.15)",
                }}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{
                  duration: 0.12,
                  repeat: Infinity,
                }}
              >
                ⚠
              </motion.p>

              <p
                className="mt-4 font-mono text-sm font-bold uppercase tracking-[0.35em] md:text-lg"
                style={{
                  color: "#ff0040",
                  textShadow: "0 0 20px rgba(255,0,64,0.7)",
                }}
              >
                Oxygen Critical
              </p>

              <motion.p
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.5em] text-white/30"
                animate={{ opacity: [0.2, 0.7, 0.2] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                Damage irreversible — System collapse imminent
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}