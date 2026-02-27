"use client";

/**
 * RecoveryManager — drives the forest regeneration timer after reset().
 *
 * Every second of real time, tickRecovery() advances recovery by 1.2 %.
 * Full visual recovery takes ~83 seconds — a sharp contrast with
 * the near-instant destruction caused by typing.
 *
 * This asymmetry IS the lesson: destruction is fast; recovery is slow.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

export default function RecoveryManager() {
  const isRecovering = useStore((s) => s.isRecovering);
  const recoveryProgress = useStore((s) => s.recoveryProgress);
  const tickRecovery = useStore((s) => s.tickRecovery);

  // Advance recovery every second
  useEffect(() => {
    if (!isRecovering) return;
    const id = setInterval(tickRecovery, 1000);
    return () => clearInterval(id);
  }, [isRecovering, tickRecovery]);

  const pct = Math.round(recoveryProgress * 100);
  // Estimated seconds remaining
  const remaining = Math.ceil(((1 - recoveryProgress) / 0.012));
  const timeStr =
    remaining > 60
      ? `${Math.ceil(remaining / 60)} min`
      : `${remaining} s`;

  return (
    <AnimatePresence>
      {isRecovering && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none fixed left-6 bottom-24 z-40"
          style={{ width: "200px" }}
        >
          {/* Card */}
          <div
            style={{
              background: "rgba(2, 6, 23, 0.80)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(0,255,100,0.15)",
              borderRadius: "14px",
              padding: "12px 14px",
              boxShadow: "0 0 30px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{
                  width: 5, height: 5, borderRadius: "50%",
                  backgroundColor: "#00ff88",
                }}
              />
              <span style={{
                fontSize: "8px", fontWeight: 800,
                letterSpacing: "0.25em", textTransform: "uppercase",
                color: "rgba(0,255,136,0.7)",
              }}>
                Régénération
              </span>
            </div>

            {/* Progress bar */}
            <div style={{
              height: "3px", width: "100%",
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: "999px", overflow: "hidden",
              marginBottom: "7px",
            }}>
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "linear" }}
                style={{
                  height: "100%", borderRadius: "999px",
                  background: "linear-gradient(90deg, #00ff88, #00ccff)",
                  boxShadow: "0 0 8px rgba(0,255,136,0.5)",
                }}
              />
            </div>

            {/* Stats */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{
                fontFamily: "monospace",
                fontSize: "14px", fontWeight: 900,
                color: "#00ff88",
              }}>
                {pct}%
              </span>
              <span style={{
                fontSize: "9px", color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.1em",
              }}>
                ~{timeStr} restant
              </span>
            </div>

            {/* Lesson sub-text */}
            <p style={{
              margin: "8px 0 0",
              fontSize: "9px",
              color: "rgba(255,255,255,0.20)",
              lineHeight: 1.5,
              fontStyle: "italic",
            }}>
              La nature récupère lentement.
              <br />Le carbone, lui, ne disparaît pas.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
