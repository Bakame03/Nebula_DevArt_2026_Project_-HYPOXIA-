"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Shows the CO₂ generated globally by AI since the user started the experience.
 * Estimate: ~160 g CO₂/second globally (≈5 million tonnes/year from AI, 2026).
 */
const GLOBAL_CO2_G_PER_SEC = 160;

function formatCO2(grams: number): string {
  if (grams >= 1_000_000) return `${(grams / 1_000_000).toFixed(2)} t`;
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${Math.round(grams)} g`;
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function GlobalCO2Ticker() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const globalCO2 = elapsed * GLOBAL_CO2_G_PER_SEC;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 0.8 }}
      className="pointer-events-none fixed right-6 top-6 z-40 flex flex-col items-end gap-0.5"
    >
      <span className="text-[8px] font-bold uppercase tracking-[0.35em] text-white/20">
        IA mondiale · CO₂ session
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-lg font-black tabular-nums text-white/70">
          {formatCO2(globalCO2)}
        </span>
        <span className="font-mono text-[10px] text-white/25">
          / {formatDuration(elapsed)}
        </span>
      </div>
      <span className="text-[8px] text-white/15">
        ≈ 160 g CO₂/sec globalement
      </span>
    </motion.div>
  );
}
