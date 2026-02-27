"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SHORTCUTS = [
  { key: "C", desc: "Mode cinématique" },
  { key: "R", desc: "Réinitialiser" },
  { key: "?", desc: "Cette aide" },
];

export default function HelpPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            key="help-panel"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="mb-3 rounded-2xl border border-white/10 p-4"
            style={{
              background: "rgba(2, 6, 23, 0.85)",
              backdropFilter: "blur(16px)",
              minWidth: 180,
            }}
          >
            <p className="mb-3 text-[8px] font-bold uppercase tracking-[0.35em] text-white/25">
              Raccourcis
            </p>
            <div className="flex flex-col gap-2">
              {SHORTCUTS.map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-3">
                  <kbd className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 text-[10px] font-bold text-white/60">
                    {key}
                  </kbd>
                  <span className="text-[11px] text-white/45">{desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[11px] font-bold text-white/40 transition-all hover:border-white/25 hover:text-white/70"
        style={{ background: "rgba(2,6,23,0.7)", backdropFilter: "blur(8px)" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label={open ? "Fermer l'aide" : "Aide"}
      >
        {open ? "×" : "?"}
      </motion.button>
    </div>
  );
}
