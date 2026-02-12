"use client";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";

export default function PromptInput() {
  const { promptText, setPrompt, stressLevel, permanentDamage } = useStore();
  
  // Le stress total perçu (Actuel + Cicatrice)
  const effectiveStress = Math.min(stressLevel + permanentDamage, 1);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
      
      {/* Container qui tremble */}
      <motion.div
        animate={{
          x: effectiveStress > 0.5 ? [-2, 2, -2] : 0,
          rotate: effectiveStress > 0.8 ? [-1, 1, 0] : 0
        }}
        transition={{ repeat: Infinity, duration: 0.2 }}
        className="pointer-events-auto w-full max-w-2xl px-4"
      >
        <textarea
          value={promptText}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Tapez votre prompt ici..."
          className={`
            w-full bg-transparent text-center text-3xl font-bold outline-none border-b-2 transition-all duration-300
            ${effectiveStress > 0.8 ? 'text-red-500 border-red-500 placeholder-red-800' : 'text-white border-white/50'}
            ${effectiveStress > 0.5 ? 'blur-[1px]' : 'blur-0'} 
          `}
          style={{
            textShadow: effectiveStress > 0.8 ? '0 0 10px rgba(255,0,0,0.8)' : 'none'
          }}
          rows={2}
          spellCheck={false}
        />
      </motion.div>

      {/* Message d'alerte Hypoxie */}
      {effectiveStress > 0.9 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 text-red-600 font-mono text-2xl font-black bg-black/80 px-6 py-3 rounded border border-red-600 animate-pulse"
        >
          ⚠ OXYGEN CRITICAL ⚠
        </motion.div>
      )}
      
      {/* Indicateur de "Cicatrice" (Debug visuel optionnel) */}
      {permanentDamage > 0 && (
         <div className="absolute bottom-10 right-10 text-xs font-mono text-gray-500">
            ECO_DAMAGE: {(permanentDamage * 100).toFixed(1)}%
         </div>
      )}
    </div>
  );
}