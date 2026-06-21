"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

// If loading makes no further progress for this long, assume an asset stalled
// (a hung request, or a texture that will never resolve) and let the user
// through rather than trapping them on the loader forever.
const STALL_TIMEOUT_MS = 12000;

export default function LoadingScreen() {
  const { progress, active, errors } = useProgress();
  const [gaveUp, setGaveUp] = useState(false);

  // Stall watchdog: the timer is reset every time progress advances, so a slow
  // but still-progressing load is never cut off — only a frozen one is.
  const lastProgress = useRef(progress);
  useEffect(() => {
    if (!active) return;
    lastProgress.current = progress;
    const id = setTimeout(() => setGaveUp(true), STALL_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [progress, active]);

  // A reported load error means we'll never reach 100%, so don't keep waiting.
  const visible = active && !gaveUp && errors.length === 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617]"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                DevArt 2026
              </span>
              <h1 className="text-4xl font-bold tracking-[0.15em] text-white">
                HYPOXIA
              </h1>
              <span className="text-[11px] tracking-[0.2em] text-white/40">
                L&rsquo;Écho Numérique
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 w-64">
              <div className="h-[1px] w-full overflow-hidden bg-white/10 rounded-full">
                <motion.div
                  className="h-full bg-white/60 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.1 }}
                />
              </div>
              <span className="font-mono text-[10px] tabular-nums text-white/25">
                {Math.round(progress)}%
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
