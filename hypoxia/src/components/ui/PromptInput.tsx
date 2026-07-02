"use client";

import { useRef, useCallback } from "react";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";

// ─── Animation Variants ──────────────────────────────────────────────────────

const shakeVariants: Variants = {
  idle: { x: 0, rotate: 0 },
  shake: {
    x: [0, -2, 4, -5, 3, -2, 2, 0],
    rotate: [0, -0.15, 0.2, -0.1, 0.15, 0],
    transition: {
      duration: 0.35,
      repeat: Infinity,
      repeatType: "mirror" as const,
    },
  },
};

const btnPulseVariants: Variants = {
  idle: { scale: 1, opacity: 1 },
  critical: {
    scale: [1, 1.1, 0.95, 1.05, 1],
    opacity: [1, 0.5, 1, 0.6, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatType: "mirror" as const,
    },
  },
};

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function PlusIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 3.75v10.5M3.75 9h10.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowUpIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 14.25V3.75m0 0L4.5 8.25M9 3.75l4.5 4.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResetIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PromptInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const promptText = useStore((s) => s.promptText);
  const stressLevel = useStore((s) => s.stressLevel);
  const permanentDamage = useStore((s) => s.permanentDamage);
  const maxTokens = useStore((s) => s.maxTokens);
  const setPrompt = useStore((s) => s.setPrompt);
  const reset = useStore((s) => s.reset);

  const isCritical = stressLevel > 0.8;

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length <= maxTokens) {
        setPrompt(e.target.value);
      }
    },
    [maxTokens, setPrompt],
  );

  const handleReset = useCallback(() => {
    reset();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [reset]);

  // ── Dynamic style tokens ────────────────────────────────────────────────
  const borderColor = isCritical
    ? `rgba(255, 0, 64, ${0.4 + stressLevel * 0.4})`
    : "rgba(255, 255, 255, 0.15)"; // More subtle border

  const outerShadow = isCritical
    ? "0 0 50px rgba(220, 38, 38, 0.5), 0 0 100px rgba(255, 0, 64, 0.15)"
    : "0 8px 32px 0 rgba(31, 38, 135, 0.37)";

  const textColor = isCritical ? "#ff2050" : "#ffffff";
  const placeholderOpacity = isCritical ? "placeholder:text-red-300/30" : "placeholder:text-white/30";

  // Button colors
  const plusBtnBg = isCritical ? "rgba(255,0,64,0.12)" : "rgba(255,255,255,0.08)";
  const plusIconColor = isCritical ? "#ff0040" : "rgba(255,255,255,0.55)";
  const sendBtnBg = isCritical ? "#ff0040" : "#ffffff";
  const sendIconColor = isCritical ? "#ffffff" : "#000000";

  const resetBtnBg = isCritical ? "rgba(255,0,64,0.1)" : "rgba(255,255,255,0.05)";
  const resetIconColor = isCritical ? "#ff2050" : "rgba(255,255,255,0.4)";

  return (
    // ── Fullscreen container — blocks nothing ──────────────────────────────
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center pointer-events-none">

      {/* ── Shakeable wrapper — only the bar is interactive ──────────────── */}
      <motion.div
        className="pointer-events-auto w-[90vw] max-w-[1100px]" // Very wide
        variants={shakeVariants}
        animate={isCritical ? "shake" : "idle"}
      >
        {/* ── Liquid Glass Bar ──────────────────────────────────────────── */}
        <div
          className="relative flex flex-col gap-3 rounded-[1.5rem] md:rounded-[2rem] border px-4 py-3 md:px-5 md:py-4 overflow-hidden shadow-2xl"
          style={{
            background: isCritical
              ? "rgba(255, 10, 40, 0.1)"
              : "rgba(20, 20, 30, 0.2)", // More transparent (was 0.4)
            backdropFilter: "blur(10px) saturate(1.5)", // Slightly less blur
            WebkitBackdropFilter: "blur(10px) saturate(1.5)",
            borderColor: isCritical ? borderColor : "rgba(255, 255, 255, 0.15)",
            boxShadow: isCritical ? outerShadow : "0 8px 32px 0 rgba(0, 0, 0, 0.2)", // Lighter shadow
            transition:
              "background 0.5s ease, border-color 0.4s ease, box-shadow 0.5s ease",
          }}
        >
          {/* ── Progress Line (Yellow -> Red) ─────────────────────────── */}
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/5">
            <motion.div
              className="h-full"
              style={{
                background: "linear-gradient(90deg, #facc15 0%, #ef4444 100%)", // Yellow to Red
                boxShadow: "0 0 10px rgba(239, 68, 68, 0.5)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(promptText.length / maxTokens) * 100}%` }}
              transition={{ type: "tween", ease: "linear", duration: 0.1 }}
            />
          </div>
          {/* ── Specular Highlight (light from top) ───────────────────── */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.5rem] md:rounded-[2rem]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 100%)",
            }}
          />

          {/* ── Inner glow ring (glass edge catch) ────────────────────── */}
          <div
            className="pointer-events-none absolute inset-[1px] rounded-[1.5rem] md:rounded-[2rem]"
            style={{
              boxShadow: isCritical
                ? "inset 0 1px 0 rgba(255,100,100,0.15), inset 0 -1px 0 rgba(255,0,64,0.06)"
                : "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.04)",
              transition: "box-shadow 0.4s ease",
            }}
          />

          {/* ── Bottom row: + button, Send button ────────────────────── */}
          <div className="relative z-10 flex items-center gap-2 md:gap-3">
            {/* ── + Button ──────────────────────────────────────────────── */}
            <motion.button
              type="button"
              className="relative z-10 flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300"
              style={{
                backgroundColor: plusBtnBg,
                borderColor: isCritical
                  ? "rgba(255,0,64,0.25)"
                  : "rgba(255,255,255,0.10)",
              }}
              variants={btnPulseVariants}
              animate={isCritical ? "critical" : "idle"}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label="Ajouter un fichier"
            >
              <PlusIcon color={plusIconColor} />
            </motion.button>

            {/* ── Text Input ────────────────────────────────────────────── */}
            <textarea
              ref={textareaRef}
              value={promptText}
              onChange={handleTextareaChange}
              maxLength={maxTokens}
              rows={4}
              placeholder="Commence à taper... le système respire encore."
              spellCheck={false}
              autoFocus
              autoComplete="off"
              className={`
              relative z-10 flex-1 min-w-0 resize-none
              bg-transparent px-3 py-2
              text-[16px] md:text-lg font-medium leading-relaxed
              tracking-wide outline-none hide-scrollbar
              ${placeholderOpacity}
            `}
              style={{
                color: textColor,
                filter: isCritical ? "blur(0.5px)" : "none",
                textShadow: isCritical
                  ? "0 0 8px rgba(255,0,64,0.45)"
                  : "none",
                transition:
                  "color 0.3s ease, filter 0.3s ease, text-shadow 0.3s ease",
              }}
            />

            {/* ── Reset / Trash Button ──────────────────────────────────── */}
            <motion.button
              type="button"
              onClick={handleReset}
              className="relative z-10 flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 border"
              style={{
                backgroundColor: resetBtnBg,
                borderColor: isCritical ? "rgba(255,0,64,0.15)" : "rgba(255,255,255,0.05)",
              }}
              whileHover={{ scale: 1.1, rotate: -15, backgroundColor: isCritical ? "rgba(255,0,64,0.2)" : "rgba(255,255,255,0.12)" }}
              whileTap={{ scale: 0.9, rotate: 45 }}
              aria-label="Réinitialiser"
            >
              <ResetIcon color={resetIconColor} />
            </motion.button>

            {/* ── Send Button ───────────────────────────────────────────── */}
            <motion.button
              type="button"
              className="relative z-10 flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300"
              style={{ backgroundColor: sendBtnBg }}
              variants={btnPulseVariants}
              animate={isCritical ? "critical" : "idle"}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label="Envoyer"
            >
              <ArrowUpIcon color={sendIconColor} />
            </motion.button>
          </div>

          {/* ── Oxygen Warning Overlay ── */}
          {promptText.length >= maxTokens && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-[1.5rem] md:rounded-[2rem] z-20 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-2 text-red-500 animate-pulse">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
                <span className="font-bold tracking-[0.2em] text-xs uppercase">Oxygène Épuisé</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── HUD Below: Integrity + Tokens + Écho ──────────────────────── */}
        <div className="flex items-center justify-between px-2 pt-2 md:px-8 md:pt-3">
          {/* System Integrity */}
          <div className="flex items-center gap-2 md:gap-3">
            <span
              className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.25em]"
              style={{
                color: isCritical ? "#ff0040" : "rgba(255,255,255,0.3)",
              }}
            >
              Integrity
            </span>
            <div className="h-[2px] w-16 md:w-28 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: isCritical ? "#ff0040" : "#00ffaa",
                  boxShadow: isCritical
                    ? "0 0 10px rgba(255,0,64,0.6)"
                    : "0 0 6px rgba(0,255,170,0.4)",
                }}
                animate={{ width: `${Math.max(1 - stressLevel, 0) * 100}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
              />
            </div>
          </div>

          {/* Écho */}
          <div className="flex items-center gap-1 md:gap-1.5">
            <span className="text-[8px] md:text-[9px] font-semibold uppercase tracking-[0.2em] text-white/20">
              Écho
            </span>
            <span
              className="font-mono text-[9px] md:text-[10px] font-bold tabular-nums"
              style={{
                color:
                  permanentDamage > 0 ? "#ff0040" : "rgba(255,255,255,0.15)",
              }}
            >
              {(permanentDamage * 100).toFixed(1)}%
            </span>
          </div>

          {/* Token counter */}
          <div className="flex items-center gap-1 md:gap-1.5">
            <span
              className="font-mono text-[10px] md:text-[11px] font-bold tabular-nums tracking-wider"
              style={{
                color: isCritical ? "#ff0040" : "rgba(255,255,255,0.4)",
              }}
            >
              {String(promptText.length).padStart(3, "0")}
            </span>
            <span className="font-mono text-[10px] md:text-[11px] text-white/15">
              / {maxTokens}
            </span>
            <span className="text-[7px] md:text-[8px] font-semibold uppercase tracking-[0.15em] text-white/12">
              Tokens
            </span>
          </div>
        </div>
      </motion.div >
    </div >
  );
}