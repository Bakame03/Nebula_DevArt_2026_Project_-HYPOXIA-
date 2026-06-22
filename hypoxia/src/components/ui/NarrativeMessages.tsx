"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store/useStore";

const MILESTONES: { threshold: number; text: string; sub: string }[] = [
  {
    threshold: 0.25,
    text: "La rivière commence à ralentir…",
    sub: "Seuil 25 % — Dégradation initiale",
  },
  {
    threshold: 0.50,
    text: "Les oiseaux ont fui la forêt.",
    sub: "Seuil 50 % — Faune disparue",
  },
  {
    threshold: 0.75,
    text: "Le sol se craquelle. L'air brûle.",
    sub: "Seuil 75 % — Biome effondré",
  },
  {
    threshold: 1.00,
    text: "Il ne reste rien.",
    sub: "Seuil 100 % — Point de non-retour",
  },
];

const CHAR_DELAY_MS = 40;

interface ActiveMessage {
  text: string;
  sub: string;
  index: number;
}

export default function NarrativeMessages() {
  const stressLevel = useStore((s) => s.stressLevel);

  const [active, setActive] = useState<ActiveMessage | null>(null);
  const [visibleChars, setVisibleChars] = useState(0);

  const shownRef = useRef<Set<number>>(new Set());
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
  };

  const triggerMessage = (msg: ActiveMessage) => {
    clearTimers();
    setActive(msg);
    setVisibleChars(0);

    let i = 0;
    typeIntervalRef.current = setInterval(() => {
      i++;
      setVisibleChars(i);
      if (i >= msg.text.length) {
        clearInterval(typeIntervalRef.current!);
        dismissTimerRef.current = setTimeout(() => setActive(null), 4500);
      }
    }, CHAR_DELAY_MS);
  };

  useEffect(() => {
    for (let idx = 0; idx < MILESTONES.length; idx++) {
      const m = MILESTONES[idx];
      if (stressLevel >= m.threshold && !shownRef.current.has(m.threshold)) {
        shownRef.current.add(m.threshold);
        triggerMessage({ text: m.text, sub: m.sub, index: idx });
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stressLevel]);

  useEffect(() => {
    if (stressLevel === 0) {
      clearTimers();
      shownRef.current.clear();
      setActive(null);
      setVisibleChars(0);
    }
  }, [stressLevel]);

  const displayed = active ? active.text.slice(0, visibleChars) : "";
  const isTyping = active !== null && visibleChars < (active?.text.length ?? 0);

  // Accent colour ramps with milestone index
  const accentColors = ["#00ffaa", "#facc15", "#f97316", "#ff0040"];
  const accent = active ? accentColors[active.index] : "#00ffaa";

  return (
    <div className="pointer-events-none fixed right-6 top-1/3 z-40 -translate-y-1/2 hidden md:block">
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.text}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-[260px] overflow-hidden rounded-2xl border border-white/10"
            style={{
              background: "rgba(4, 8, 28, 0.80)",
              backdropFilter: "blur(20px)",
              boxShadow: `0 0 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}
          >
            {/* Left accent bar */}
            <motion.div
              className="absolute left-0 top-0 h-full w-[3px]"
              style={{ backgroundColor: accent }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            />

            {/* Top: milestone indicator dots */}
            <div className="flex gap-1.5 px-4 pt-3 pb-0">
              {MILESTONES.map((_, i) => (
                <motion.div
                  key={i}
                  className="h-[3px] flex-1 rounded-full"
                  style={{
                    backgroundColor:
                      i <= active.index ? accent : "rgba(255,255,255,0.08)",
                  }}
                  animate={{
                    opacity: i === active.index ? [1, 0.5, 1] : 1,
                  }}
                  transition={
                    i === active.index
                      ? { duration: 1.2, repeat: Infinity }
                      : {}
                  }
                />
              ))}
            </div>

            {/* Main message */}
            <div className="px-4 py-3">
              <p
                className="text-[15px] font-semibold leading-snug tracking-wide text-white/90"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                {displayed}
                {isTyping && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{
                      duration: 0.45,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    style={{ color: accent }}
                  >
                    ▌
                  </motion.span>
                )}
              </p>
            </div>

            {/* Sub-label */}
            <div
              className="border-t border-white/[0.05] px-4 py-2"
              style={{ borderColor: `${accent}18` }}
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25">
                {active.sub}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
