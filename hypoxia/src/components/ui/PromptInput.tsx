'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useStore, selectVisibleStress, selectCharactersRemaining } from '@/store/useStore';

const MAX_CHARS = 200;

export default function PromptInput() {
  const { promptText, setPrompt } = useStore();
  const visibleStress = useStore(selectVisibleStress);
  const charsRemaining = useStore(selectCharactersRemaining);
  
  // Derived visual states
  const isStressed = visibleStress > 0.5;
  const isHighStress = visibleStress > 0.8;
  const isCritical = visibleStress > 0.9;
  const integrityPercentage = Math.max(0, (1 - visibleStress) * 100);

  // Shake animation configuration
  const shakeVariants: Variants = {
    idle: { x: 0, scale: 1 },
    shaking: {
      x: [0, -2, 2, -2, 2, 0],
      transition: { repeat: Infinity, duration: 0.2 },
    },
    critical: {
      x: [0, -5, 5, -5, 5, 0],
      scale: [1, 1.02, 0.98, 1],
      transition: { repeat: Infinity, duration: 0.1, ease: 'linear' as const },
    },
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden pointer-events-none">
      {/* Background Overlay for Critical State */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-900 pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      {/* Input Container */}
      <motion.div
        className="relative w-full max-w-4xl z-10 pointer-events-auto"
        animate={isHighStress ? (isCritical ? 'critical' : 'shaking') : 'idle'}
        variants={shakeVariants}
      >
        <textarea
          value={promptText}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Taper pour survivre..."
          className={`
            w-full bg-transparent text-center outline-none resize-none overflow-hidden
            text-4xl font-bold font-mono transition-all duration-300
            placeholder:text-white/20 caret-white
            ${isStressed ? 'blur-[1px] text-red-200' : 'text-white'}
            ${isHighStress ? 'text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]' : 'drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]'}
          `}
          rows={3}
          spellCheck={false}
          autoFocus
        />
      </motion.div>

      {/* Critical Alert - Jumpscare */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1.2, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="absolute z-50 text-red-600 font-bold text-center pointer-events-none select-none top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{ textShadow: '0 0 20px rgba(255,0,0,1)' }}
          >
            <div className="text-6xl tracking-tighter shimmer-text">⚠ SYSTEM FAILURE</div>
            <div className="text-3xl mt-2 tracking-widest text-red-400">OXYGEN DEPLETED</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD (Head-Up Display) */}
      <div className="absolute bottom-10 w-full max-w-2xl flex flex-col gap-2 pointer-events-auto">
        <div className="flex justify-between items-end font-mono text-xs text-white/60 tracking-widest uppercase">
          <span className={isCritical ? 'text-red-500 animate-pulse' : ''}>
            System Integrity
          </span>
          <span className={charsRemaining < 20 ? 'text-red-500 animate-pulse' : ''}>
            {promptText.length} / {MAX_CHARS} TOKENS
          </span>
        </div>

        {/* Integrity Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
          <motion.div
            className={`h-full shadow-[0_0_10px_rgba(255,255,255,0.5)] ${
              isHighStress ? 'bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)]' : 'bg-cyan-400'
            }`}
            initial={{ width: '100%' }}
            animate={{ 
              width: `${integrityPercentage}%`,
              backgroundColor: isHighStress ? '#ef4444' : '#22d3ee'
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
        
        {/* Decorative HUD Elements */}
        <div className="flex justify-between mt-1 opacity-30">
             <div className="w-2 h-2 bg-white rounded-full animate-ping" />
             <div className="w-16 h-[1px] bg-white/50" />
             <div className="w-2 h-2 bg-white rounded-full animate-ping delay-75" />
        </div>
      </div>
      
      {/* Global CSS for glitch/text effects */}
      <style jsx global>{`
        .shimmer-text {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(to right, #ef4444 40%, #ffffff 50%, #ef4444 60%);
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes shimmer {
          to {
            background-position: 200% center;
          }
        }
      `}</style>
    </div>
  );
}