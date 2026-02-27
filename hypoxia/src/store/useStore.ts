import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Constants ───────────────────────────────────────────────────────────────
export const MAX_TOKENS = 60;
export const DEAD_TREE_THRESHOLD = 45;
const CRITICAL_THRESHOLD = 0.75;
const DAMAGE_INCREMENT = 0.002;
const MAX_PERMANENT_DAMAGE = 0.5;

/**
 * CO₂ equivalent per character typed.
 * Based on LLM energy estimates: ~0.003 kWh/1000 tokens × 400g CO₂/kWh ≈ 0.005g/token.
 * Displayed in milligrams for legibility at low usage.
 */
const CO2_PER_CHAR_G = 0.005;

// ─── Types ───────────────────────────────────────────────────────────────────
interface HypoxiaState {
  promptText: string;
  stressLevel: number;
  /**
   * Ecological scar — "L'Écho".
   * Accumulates irreversibly when stress > 0.75.
   * Capped at MAX_PERMANENT_DAMAGE (0.5). The system never fully heals.
   */
  permanentDamage: number;
  maxTokens: number;
  /** Cumulative characters typed this session (deletions do not subtract). */
  totalCharsTyped: number;
  /** Cumulative CO₂ equivalent in grams for this session. */
  co2Grams: number;
  /** True when the prompt has reached the hard limit — triggers the end screen. */
  hasReachedMax: boolean;
  /** True immediately after reset() — the forest is visually regenerating. */
  isRecovering: boolean;
  /** Visual recovery progress 0..1 (driven by a timer, not gameplay). */
  recoveryProgress: number;

  setPrompt: (text: string) => void;
  /** Soft reset: clears text but preserves permanent damage and session CO₂. */
  reset: () => void;
  /** Hard reset: wipes everything including permanent damage (new session). */
  hardReset: () => void;
  /** Advance recovery — called every second by RecoveryManager. */
  tickRecovery: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useStore = create<HypoxiaState>()(persist((set, get) => ({
  promptText: "",
  stressLevel: 0,
  permanentDamage: 0,
  maxTokens: MAX_TOKENS,
  totalCharsTyped: 0,
  co2Grams: 0,
  hasReachedMax: false,
  isRecovering: false,
  recoveryProgress: 0,

  setPrompt: (text: string) => {
    const { permanentDamage: prevDamage, totalCharsTyped, promptText } = get();

    const rawStress = Math.min(text.length / MAX_TOKENS, 1);

    let nextDamage = prevDamage;
    if (rawStress > CRITICAL_THRESHOLD) {
      nextDamage = Math.min(prevDamage + DAMAGE_INCREMENT, MAX_PERMANENT_DAMAGE);
    }

    const effectiveStress = Math.min(Math.max(rawStress, nextDamage), 1);

    // Only new characters count toward CO₂ — deletions don't "give back" energy.
    const newChars = Math.max(0, text.length - promptText.length);
    const nextTotal = totalCharsTyped + newChars;

    set({
      promptText: text,
      stressLevel: effectiveStress,
      permanentDamage: nextDamage,
      totalCharsTyped: nextTotal,
      co2Grams: nextTotal * CO2_PER_CHAR_G,
      hasReachedMax: text.length >= MAX_TOKENS,
    });
  },

  reset: () => {
    const { permanentDamage, totalCharsTyped, co2Grams } = get();
    set({
      promptText: "",
      stressLevel: permanentDamage,
      permanentDamage,
      maxTokens: MAX_TOKENS,
      totalCharsTyped,
      co2Grams,
      hasReachedMax: false,
      isRecovering: true,
      recoveryProgress: 0,
    });
  },

  hardReset: () =>
    set({
      promptText: "",
      stressLevel: 0,
      permanentDamage: 0,
      maxTokens: MAX_TOKENS,
      totalCharsTyped: 0,
      co2Grams: 0,
      hasReachedMax: false,
      isRecovering: false,
      recoveryProgress: 0,
    }),

  tickRecovery: () => {
    const { isRecovering, recoveryProgress } = get();
    if (!isRecovering) return;
    const next = Math.min(recoveryProgress + 0.012, 1); // ~83s to full recovery
    set({ recoveryProgress: next, isRecovering: next < 1 });
  },
}), {
  name: "hypoxia-echo",
  // Only persist the "scar" — the ecological damage that outlasts the session.
  partialize: (state) => ({
    permanentDamage: state.permanentDamage,
    totalCharsTyped: state.totalCharsTyped,
    co2Grams: state.co2Grams,
  }),
}));
