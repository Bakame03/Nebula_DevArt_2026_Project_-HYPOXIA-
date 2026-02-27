"use client";

/**
 * ExtinctSpecies — shows which bird species are "still singing" in the scene.
 * As stress rises, species disappear one by one — mirroring the real
 * 6th mass extinction accelerated by climate change and energy overconsumption.
 *
 * Species list mixes critically endangered and already-extinct species.
 * When they disappear from the UI, they are gone from the soundscape too.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

interface Species {
  name: string;
  status: string;        // conservation status label
  disappearAt: number;   // stress threshold at which this species goes silent
  extinct?: boolean;     // already gone from Earth
}

const SPECIES: Species[] = [
  { name: "Merle noir",              status: "Préoccupant",    disappearAt: 0.20 },
  { name: "Rossignol philomèle",     status: "Vulnérable",     disappearAt: 0.35 },
  { name: "Alouette des champs",     status: "En déclin",      disappearAt: 0.48 },
  { name: "Tourterelle des bois",    status: "En danger",      disappearAt: 0.60 },
  { name: "Grive musicienne",        status: "Vulnérable",     disappearAt: 0.72 },
  { name: "Pigeon voyageur",         status: "ÉTEINT en 1914", disappearAt: 0.82, extinct: true },
  { name: "Huia de Nouvelle-Zélande",status: "ÉTEINT en 1907", disappearAt: 0.92, extinct: true },
];

export default function ExtinctSpecies() {
  const stressLevel = useStore((s) => s.stressLevel);

  const alive = SPECIES.filter((s) => stressLevel < s.disappearAt);

  // Don't show if all gone or stress too low to matter
  if (stressLevel < 0.05) return null;

  return (
    <div className="pointer-events-none fixed left-6 top-1/2 -translate-y-1/2 z-40">
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "210px" }}>
        {/* Header */}
        <div style={{
          marginBottom: "4px",
          fontSize: "8px", fontWeight: 800,
          letterSpacing: "0.28em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.18)",
        }}>
          Voix encore présentes
        </div>

        <AnimatePresence>
          {alive.map((sp) => (
            <motion.div
              key={sp.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "5px 8px",
                borderRadius: "8px",
                background: "rgba(2,6,23,0.70)",
                backdropFilter: "blur(10px)",
                border: sp.extinct
                  ? "1px solid rgba(255,100,0,0.2)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Pulse dot */}
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2 + Math.random(), repeat: Infinity }}
                style={{
                  width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: sp.extinct ? "#ff6b35" : "#00ffaa",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "10px", fontWeight: 600,
                  color: sp.extinct ? "rgba(255,150,80,0.85)" : "rgba(255,255,255,0.75)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {sp.name}
                </div>
                <div style={{
                  fontSize: "7.5px", color: "rgba(255,255,255,0.22)",
                  letterSpacing: "0.08em",
                }}>
                  {sp.status}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* If all gone */}
        {alive.length === 0 && stressLevel > 0.05 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontSize: "9px", fontStyle: "italic",
              color: "rgba(255,255,255,0.15)",
              padding: "4px 8px",
            }}
          >
            Silence.
          </motion.div>
        )}
      </div>
    </div>
  );
}
