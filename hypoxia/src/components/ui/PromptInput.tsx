"use client";

import { useRef, useCallback } from "react";
import type { Variants } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

// ─── Animation Variants ──────────────────────────────────────────────────────

const shakeVariant = {
  shake: {
    x: [0, -4, 4, -6, 6, -3, 3, 0],
    transition: { duration: 0.4, repeat: Infinity, repeatType: "mirror" as const },
  },
  idle: { x: 0 },
};

const alertVariant: Variants = {
  initial: { opacity: 0, scale: 0.85, filter: "blur(12px)" },
  animate: {
    opacity: [0.7, 1, 0.7],
    scale: [0.98, 1.02, 0.98],
    filter: "blur(0px)",
    transition: {
      opacity: { duration: 0.6, repeat: Infinity, ease: "easeInOut" as const },
      scale: { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const },
      filter: { duration: 0.3 },
    },
  },
  exit: { opacity: 0, scale: 0.8, filter: "blur(16px)", transition: { duration: 0.3 } },
};

const hudVariant: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStressColor(stress: number): string {
  if (stress > 0.8) return "#ff0040"; // Neon red — critical
  if (stress > 0.5) return "#ff6a00"; // Warning orange
  if (stress > 0.3) return "#ffcc00"; // Caution yellow
  return "#00ffaa"; // Safe — cyan/green
}

function getIntegrityLabel(stress: number): string {
  if (stress > 0.9) return "CRITICAL";
  if (stress > 0.7) return "DEGRADED";
  if (stress > 0.4) return "UNSTABLE";
  return "NOMINAL";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PromptInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const promptText = useStore((s) => s.promptText);
  const stressLevel = useStore((s) => s.stressLevel);
  const maxChars = useStore((s) => s.maxChars);
  const permanentDamage = useStore((s) => s.permanentDamage);
  const setPrompt = useStore((s) => s.setPrompt);

  const integrity = Math.max(1 - stressLevel, 0);
  const charCount = promptText.length;
  const color = getStressColor(stressLevel);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (val.length <= maxChars) setPrompt(val);
    },
    [maxChars, setPrompt],
  );

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
      onClick={() => textareaRef.current?.focus()}
    >
      {/* ── Ambient stress glow ─────────────────────────────────────────── */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        animate={{
          background: `radial-gradient(ellipse at center, ${color}${Math.round(stressLevel * 25)
            .toString(16)
            .padStart(2, "0")} 0%, transparent 70%)`,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* ── Scanline overlay ────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)",
        }}
      />

      {/* ── Central Textarea ────────────────────────────────────────────── */}
      <motion.div
        className="relative z-20 flex w-full max-w-4xl flex-col items-center px-6"
        variants={shakeVariant}
        animate={stressLevel > 0.8 ? "shake" : "idle"}
      >
        <textarea
          ref={textareaRef}
          value={promptText}
          onChange={handleChange}
          maxLength={maxChars}
          rows={5}
          placeholder="TYPE AND WATCH THE SYSTEM BREATHE..."
          spellCheck={false}
          autoFocus
          className="w-full resize-none bg-transparent text-center font-bold leading-tight tracking-wide text-white caret-white outline-none placeholder:text-white/20"
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.75rem)",
            filter: stressLevel > 0.5 ? `blur(${(stressLevel - 0.5) * 3}px)` : "none",
            color: stressLevel > 0.8 ? "#ff0040" : "#ffffff",
            textShadow:
              stressLevel > 0.8
                ? "0 0 20px rgba(255,0,64,0.7), 0 0 40px rgba(255,0,64,0.3)"
                : stressLevel > 0.5
                  ? "0 0 10px rgba(255,106,0,0.3)"
                  : "none",
            transition: "filter 0.3s ease, color 0.3s ease, text-shadow 0.3s ease",
          }}
        />
      </motion.div>

      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="glass-panel absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-8 rounded-full border border-white/[0.06] px-8 py-3"
        variants={hudVariant}
        initial="initial"
        animate="animate"
      >
        {/* System Integrity Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color }}
            >
              System Integrity
            </span>
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-wider"
              style={{ color }}
            >
              {getIntegrityLabel(stressLevel)}
            </span>
          </div>
          <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              animate={{ width: `${integrity * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-white/10" />

        {/* Token counter */}
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-sm font-bold tabular-nums tracking-wider"
            style={{ color }}
          >
            {String(charCount).padStart(3, "0")}
          </span>
          <span className="font-mono text-sm text-white/30">/ {maxChars}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20">
            Tokens
          </span>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-white/10" />

        {/* Permanent Damage indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
            Écho
          </span>
          <span
            className="font-mono text-xs font-bold tabular-nums"
            style={{ color: permanentDamage > 0 ? "#ff0040" : "rgba(255,255,255,0.25)" }}
          >
            {(permanentDamage * 100).toFixed(1)}%
          </span>
        </div>
      </motion.div>

      {/* ── Critical Alert — "The Jumpscare" ────────────────────────────── */}
      <AnimatePresence>
        {stressLevel > 0.9 && (
          <motion.div
            key="system-failure"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            variants={alertVariant}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Blood-red vignette */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 30%, rgba(255,0,64,0.15) 100%)",
              }}
            />

            {/* Glitch line */}
            <motion.div
              className="absolute left-0 right-0 h-px bg-red-500/60"
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            {/* Main warning */}
            <div className="relative select-none text-center">
              <motion.p
                className="text-6xl font-black tracking-widest md:text-8xl"
                style={{
                  color: "#ff0040",
                  textShadow:
                    "0 0 30px rgba(255,0,64,0.8), 0 0 60px rgba(255,0,64,0.4), 0 0 120px rgba(255,0,64,0.2)",
                }}
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 0.15, repeat: Infinity }}
              >
                ⚠
              </motion.p>
              <p
                className="mt-4 font-mono text-sm font-bold uppercase tracking-[0.3em] md:text-base"
                style={{
                  color: "#ff0040",
                  textShadow: "0 0 15px rgba(255,0,64,0.6)",
                }}
              >
                System Failure — Oxygen Depleted
              </p>
              <motion.p
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.4em] text-white/30"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Irreversible damage detected
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}