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

// ─── Component ───────────────────────────────────────────────────────────────

export default function PromptInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const promptText = useStore((s) => s.promptText);
  const stressLevel = useStore((s) => s.stressLevel);
  const permanentDamage = useStore((s) => s.permanentDamage);
  const maxChars = useStore((s) => s.maxChars);
  const setPrompt = useStore((s) => s.setPrompt);

  const isCritical = stressLevel > 0.8;

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length <= maxChars) {
        setPrompt(e.target.value);
      }
    },
    [maxChars, setPrompt],
  );

  // ── Dynamic style tokens ────────────────────────────────────────────────
  const borderColor = isCritical
    ? `rgba(255, 0, 64, ${0.4 + stressLevel * 0.4})`
    : "rgba(255, 255, 255, 0.20)";

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

  return (
    // ── Fullscreen container — blocks nothing ──────────────────────────────
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center pointer-events-none">

      {/* ── Shakeable wrapper — only the bar is interactive ──────────────── */}
      <motion.div
        className="pointer-events-auto w-[90%] max-w-xl"
        variants={shakeVariants}
        animate={isCritical ? "shake" : "idle"}
      >
        {/* ── Liquid Glass Bar ──────────────────────────────────────────── */}
        <div
          className="relative flex flex-col gap-3 rounded-[2rem] border px-5 py-4"
          style={{
            background: isCritical
              ? "rgba(255, 10, 40, 0.06)"
              : "rgba(255, 255, 255, 0.10)",
            backdropFilter: "blur(60px) saturate(1.4)",
            WebkitBackdropFilter: "blur(60px) saturate(1.4)",
            borderColor,
            boxShadow: outerShadow,
            transition:
              "background 0.5s ease, border-color 0.4s ease, box-shadow 0.5s ease",
          }}
        >
          {/* ── Specular Highlight (light from top) ───────────────────── */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[2rem]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 100%)",
            }}
          />

          {/* ── Inner glow ring (glass edge catch) ────────────────────── */}
          <div
            className="pointer-events-none absolute inset-[1px] rounded-[2rem]"
            style={{
              boxShadow: isCritical
                ? "inset 0 1px 0 rgba(255,100,100,0.15), inset 0 -1px 0 rgba(255,0,64,0.06)"
                : "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.04)",
              transition: "box-shadow 0.4s ease",
            }}
          />

          {/* ── Bottom row: + button, Send button ────────────────────── */}
          <div className="relative z-10 flex items-center gap-3">
            {/* ── + Button ──────────────────────────────────────────────── */}
            <motion.button
              type="button"
              className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300"
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
              maxLength={maxChars}
              rows={4}
              placeholder="Commence à taper... le système respire encore."
              spellCheck={false}
              autoFocus
              autoComplete="off"
              className={`
              relative z-10 flex-1 min-w-0 resize-none
              bg-transparent px-3 py-2 text-lg font-medium leading-relaxed
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

            {/* ── Send Button ───────────────────────────────────────────── */}
            <motion.button
              type="button"
              className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300"
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
        </div>

        {/* ── HUD Below: Integrity + Tokens + Écho ──────────────────────── */}
        <div className="flex items-center justify-between px-8 pt-3">
          {/* System Integrity */}
          <div className="flex items-center gap-3">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.25em]"
              style={{
                color: isCritical ? "#ff0040" : "rgba(255,255,255,0.3)",
              }}
            >
              Integrity
            </span>
            <div className="h-[2px] w-28 overflow-hidden rounded-full bg-white/[0.06]">
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
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/20">
              Écho
            </span>
            <span
              className="font-mono text-[10px] font-bold tabular-nums"
              style={{
                color:
                  permanentDamage > 0 ? "#ff0040" : "rgba(255,255,255,0.15)",
              }}
            >
              {(permanentDamage * 100).toFixed(1)}%
            </span>
          </div>

          {/* Token counter */}
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono text-[11px] font-bold tabular-nums tracking-wider"
              style={{
                color: isCritical ? "#ff0040" : "rgba(255,255,255,0.4)",
              }}
            >
              {String(promptText.length).padStart(3, "0")}
            </span>
            <span className="font-mono text-[11px] text-white/15">
              / {maxChars}
            </span>
            <span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-white/12">
              Tokens
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}