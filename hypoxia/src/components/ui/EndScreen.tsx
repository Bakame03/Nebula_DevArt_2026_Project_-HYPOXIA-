"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

// ─── CO₂ Equivalences ─────────────────────────────────────────────────────────
const STREAMING_G_PER_MIN = 0.036;
const GOOGLE_SEARCH_G = 0.2;
const SCALE_MILLION = 1_000_000;

// ─── Eco-score ────────────────────────────────────────────────────────────────
interface EcoScore {
  grade: string;
  label: string;
  color: string;
}

function getEcoScore(damage: number): EcoScore {
  if (damage === 0)   return { grade: "A+", label: "Pristine",       color: "#00ff88" };
  if (damage < 0.05)  return { grade: "A",  label: "Faible impact",  color: "#44dd44" };
  if (damage < 0.15)  return { grade: "B",  label: "Acceptable",     color: "#aaee00" };
  if (damage < 0.30)  return { grade: "C",  label: "Préoccupant",    color: "#ffaa00" };
  if (damage < 0.40)  return { grade: "D",  label: "Dangereux",      color: "#ff6600" };
  return               { grade: "F",  label: "Catastrophique", color: "#ff0040" };
}

interface StatBlockProps {
  label: string;
  value: string;
  sub?: string;
  critical?: boolean;
}

function StatBlock({ label, value, sub, critical }: StatBlockProps) {
  return (
    <div className="flex flex-col gap-1 border border-white/10 rounded-xl p-4">
      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
        {label}
      </span>
      <span
        className="text-2xl font-black tabular-nums"
        style={{ color: critical ? "#ff0040" : "#ffffff" }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-white/35 leading-tight">{sub}</span>
      )}
    </div>
  );
}

interface EndScreenProps {
  visible: boolean;
}

export default function EndScreen({ visible }: EndScreenProps) {
  const co2Grams = useStore((s) => s.co2Grams);
  const permanentDamage = useStore((s) => s.permanentDamage);
  const totalCharsTyped = useStore((s) => s.totalCharsTyped);
  const hardReset = useStore((s) => s.hardReset);

  const streamingMinutes = (co2Grams / STREAMING_G_PER_MIN).toFixed(0);
  const googleSearches = (co2Grams / GOOGLE_SEARCH_G).toFixed(1);
  const scaleCo2Tonnes = ((co2Grams * SCALE_MILLION) / 1000).toFixed(1);
  const scaleCo2Display =
    co2Grams * SCALE_MILLION < 1000
      ? `${(co2Grams * SCALE_MILLION).toFixed(0)} kg`
      : `${scaleCo2Tonnes} t`;

  const score = getEcoScore(permanentDamage);

  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const tmp = document.createElement("canvas");
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const c = tmp.getContext("2d");
    if (!c) return;

    // Composite: 3D scene + branded overlay
    c.drawImage(canvas, 0, 0);

    c.fillStyle = "rgba(2, 6, 23, 0.65)";
    c.fillRect(0, 0, tmp.width, tmp.height);

    const s = tmp.width / 1920; // scale factor
    c.fillStyle = "rgba(255,0,64,0.9)";
    c.font = `bold ${Math.round(64 * s)}px monospace`;
    c.fillText("HYPOXIA", 60 * s, 100 * s);

    c.fillStyle = "rgba(255,255,255,0.6)";
    c.font = `${Math.round(24 * s)}px monospace`;
    c.fillText("L'Écho Numérique · DevArt 2026", 60 * s, 140 * s);

    c.fillStyle = "rgba(255,0,64,0.8)";
    c.font = `bold ${Math.round(32 * s)}px monospace`;
    c.fillText(`CO₂ généré : ${co2Grams.toFixed(3)} g`, 60 * s, tmp.height - 100 * s);

    c.fillStyle = "rgba(255,255,255,0.35)";
    c.font = `${Math.round(18 * s)}px monospace`;
    c.fillText(`Dommages permanents : ${(permanentDamage * 100).toFixed(1)}%`, 60 * s, tmp.height - 60 * s);

    const link = document.createElement("a");
    link.download = `hypoxia-echo-${Date.now()}.png`;
    link.href = tmp.toDataURL("image/png");
    link.click();
  }, [co2Grams, permanentDamage]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="endscreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-6"
          style={{ backdropFilter: "blur(20px)", background: "rgba(2,6,23,0.85)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-lg flex flex-col gap-6"
          >
            {/* Header */}
            <div className="flex flex-col items-center gap-2 text-center">
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-red-500"
              />
              <h2 className="text-3xl font-black tracking-[0.15em] text-white">
                SYSTÈME ASPHYXIÉ
              </h2>
              <p className="text-sm tracking-[0.2em] text-white/40 uppercase">
                L&rsquo;Écho de votre passage
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatBlock
                label="CO₂ généré"
                value={`${co2Grams.toFixed(3)} g`}
                sub={`≈ ${streamingMinutes} min de streaming`}
                critical
              />
              <StatBlock
                label="Dommages permanents"
                value={`${(permanentDamage * 100).toFixed(1)}%`}
                sub="Cicatrice irréversible"
                critical={permanentDamage > 0}
              />
              <StatBlock
                label="Tokens consumés"
                value={String(totalCharsTyped)}
                sub={`≈ ${googleSearches} recherches Google`}
              />
              <StatBlock
                label="Intégrité écosystème"
                value="0%"
                sub="L'environnement est mort"
              />
            </div>

            {/* Scale effect — the real message */}
            <div
              className="rounded-xl border border-red-500/20 p-4 text-center"
              style={{ background: "rgba(255,0,64,0.06)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-2">
                À l&rsquo;échelle de 1 000 000 d&rsquo;utilisateurs
              </p>
              <p className="text-2xl font-black text-red-400">
                {scaleCo2Display} de CO₂
              </p>
              <p className="text-[11px] text-white/40 mt-1">
                Pour une seule session comme la vôtre
              </p>
            </div>

            {/* Eco-score */}
            <div
              className="flex items-center gap-5 rounded-xl border p-4"
              style={{
                borderColor: `${score.color}33`,
                background: `${score.color}0d`,
              }}
            >
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-4xl font-black"
                style={{ color: score.color, background: `${score.color}1a` }}
              >
                {score.grade}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
                  Éco-Score
                </span>
                <span className="text-lg font-black" style={{ color: score.color }}>
                  {score.label}
                </span>
                <span className="text-[10px] text-white/35">
                  Basé sur les dommages permanents causés à l&rsquo;écosystème
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleScreenshot}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 transition-all hover:border-white/35 hover:text-white"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Ma Cicatrice
              </button>
              <button
                onClick={hardReset}
                className="flex-1 rounded-xl bg-white py-3 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-white/90"
              >
                Recommencer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
