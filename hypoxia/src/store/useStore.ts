import { create } from "zustand";

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_CHARS = 200;
const CRITICAL_THRESHOLD = 0.75;
const DAMAGE_INCREMENT = 0.002;
const MAX_PERMANENT_DAMAGE = 0.5;

// ─── Types ───────────────────────────────────────────────────────────────────
interface HypoxiaState {
  /** Current prompt text entered by the user. */
  promptText: string;
  /**
   * Effective stress level exposed to components.
   * Always >= permanentDamage (the system never fully heals).
   * Range: [0, 1].
   */
  stressLevel: number;

  /**
   * Ecological scar — "L'Écho".
   * Accumulates irreversibly when the system enters the critical zone (> 0.75).
   * Capped at MAX_PERMANENT_DAMAGE (0.5).
   */
  permanentDamage: number;

  /** Hard character limit before system "death". */
  maxChars: number;

  // ── Actions ──────────────────────────────────────────────────────────────
  setPrompt: (text: string) => void;
  reset: () => void;
}

// ─── Initial values ──────────────────────────────────────────────────────────
const initialState = {
  promptText: "",
  stressLevel: 0,
  permanentDamage: 0,
  maxChars: MAX_CHARS,
} as const;

// ─── Store ───────────────────────────────────────────────────────────────────
export const useStore = create<HypoxiaState>()((set, get) => ({
  ...initialState,

  setPrompt: (text: string) => {
    const { permanentDamage: prevDamage } = get();

    // 1. Raw stress based purely on character count
    const rawStress = Math.min(text.length / MAX_CHARS, 1);

    // 2. "L'Écho" — accumulate permanent damage while in the critical zone
    let nextDamage = prevDamage;
    if (rawStress > CRITICAL_THRESHOLD) {
      nextDamage = Math.min(prevDamage + DAMAGE_INCREMENT, MAX_PERMANENT_DAMAGE);
    }

    // 3. Display rule: stress never drops below the scar
    //    The system never fully heals.
    const effectiveStress = Math.min(Math.max(rawStress, nextDamage), 1);

    set({
      promptText: text,
      stressLevel: effectiveStress,
      permanentDamage: nextDamage,
    });
  },

  /** Full reset — wipes text, stress, AND permanent damage. */
  reset: () => set({ ...initialState }),
}));
