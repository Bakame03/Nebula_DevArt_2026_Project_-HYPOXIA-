"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  "Vous allez communiquer avec une intelligence artificielle.",
  "Ce que vous ne voyez pas, c'est ce que ça coûte.",
  "Chaque token consomme. Chaque requête laisse une trace.",
  "Tapez votre prompt. Observez les conséquences.",
];

interface IntroScreenProps {
  onStart: () => void;
}

export default function IntroScreen({ onStart }: IntroScreenProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (lineIndex >= LINES.length) {
      const t = setTimeout(() => setShowButton(true), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLineIndex((i) => i + 1), 2600);
    return () => clearTimeout(t);
  }, [lineIndex]);

  const handleStart = useCallback(() => {
    setDismissed(true);
    setTimeout(onStart, 900);
  }, [onStart]);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "#020617",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Skip — visitors arriving from a shared link can jump straight in
              instead of waiting out the ~11s narrative. Hidden once the main
              CTA appears, which does the same thing. */}
          {!showButton && (
            <motion.button
              type="button"
              onClick={handleStart}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              whileHover={{ opacity: 0.85 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              style={{
                position: "absolute",
                bottom: "28px",
                right: "32px",
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.7)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                cursor: "none",
                outline: "none",
              }}
              aria-label="Passer l'introduction"
            >
              Passer &rarr;
            </motion.button>
          )}

          {/* Subtle grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.035,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              pointerEvents: "none",
            }}
          />

          {/* Radial glow centre */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Content column */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "48px",
              padding: "0 32px",
              maxWidth: "640px",
              width: "100%",
              textAlign: "center",
            }}
          >
            {/* ── Brand ── */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.45em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                DevArt 2026
              </span>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(42px, 8vw, 72px)",
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  textShadow: "0 0 80px rgba(255,255,255,0.12)",
                  lineHeight: 1,
                }}
              >
                HYPOXIA
              </h1>

              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.28em",
                  color: "rgba(255,255,255,0.28)",
                  fontStyle: "italic",
                }}
              >
                L&rsquo;Écho Numérique
              </span>

              {/* Thin separator */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                style={{
                  marginTop: "12px",
                  width: "48px",
                  height: "1px",
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
              />
            </motion.div>

            {/* ── Narrative line ── */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AnimatePresence mode="wait">
                {lineIndex > 0 && (
                  <motion.p
                    key={lineIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      position: "absolute",
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 300,
                      lineHeight: 1.65,
                      letterSpacing: "0.04em",
                      color: "rgba(255,255,255,0.68)",
                      fontFamily: "'Courier New', monospace",
                      maxWidth: "500px",
                    }}
                  >
                    {LINES[lineIndex - 1]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* ── Progress dots ── */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {LINES.map((_, i) => (
                <motion.div
                  key={i}
                  style={{ height: "2px", borderRadius: "999px", backgroundColor: "white" }}
                  initial={{ width: 8, opacity: 0.12 }}
                  animate={{
                    width: i < lineIndex ? 28 : 8,
                    opacity: i < lineIndex ? 0.55 : 0.12,
                  }}
                  transition={{ duration: 0.4 }}
                />
              ))}
            </div>

            {/* ── CTA Button ── */}
            <div style={{ height: "52px", display: "flex", alignItems: "center" }}>
              <AnimatePresence>
                {showButton && (
                  <motion.button
                    key="cta"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    onClick={handleStart}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 36px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.22)",
                      background: "rgba(255,255,255,0.04)",
                      backdropFilter: "blur(10px)",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      cursor: "none",
                      outline: "none",
                      transition: "border-color 0.3s, color 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.55)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)";
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.55)",
                      }}
                    />
                    Commencer l&rsquo;expérience
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.55)",
                      }}
                    />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* ── Audio hint ── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              style={{
                margin: 0,
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.18)",
              }}
            >
              Mettez vos écouteurs &mdash; L&rsquo;expérience est sonore
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
