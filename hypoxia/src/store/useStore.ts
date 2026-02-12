import { create } from 'zustand';

interface AppState {
  promptText: string;
  stressLevel: number;      // 0 à 1 (Niveau actuel de pollution)
  permanentDamage: number;  // 0 à 1 (L'ÉCHO : La cicatrice qui reste)
  
  setPrompt: (text: string) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  promptText: '',
  stressLevel: 0,
  permanentDamage: 0,

  setPrompt: (text) => set((state) => {
    // 1. Calcul du stress immédiat (Longueur du texte)
    // On considère que 100 caractères = Stress maximum
    const currentStress = Math.min(text.length / 100, 1);

    // 2. Calcul de l'ÉCHO (Cicatrice)
    // Si le stress dépasse 80%, on ajoute des dégâts permanents
    let newDamage = state.permanentDamage;
    if (currentStress > 0.8) {
      newDamage = Math.min(newDamage + 0.0005, 0.5); // Max 50% de dégâts permanents
    }

    return {
      promptText: text,
      stressLevel: currentStress, // Le niveau visuel inclut toujours les dégâts
      permanentDamage: newDamage
    };
  }),

  reset: () => set({ promptText: '', stressLevel: 0 }),
}));
