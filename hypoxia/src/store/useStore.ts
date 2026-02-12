import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Constante globale (interne ou exportée selon besoin)
const MAX_CHARS = 200;

interface HypoxiaState {
  // État
  promptText: string;
  stressLevel: number; // Surcharge immédiate (0 à 1)
  permanentDamage: number; // Cicatrice écologique (0 à 0.5)

  // Actions
  setPrompt: (text: string) => void;
  reset: () => void;
}

// Sélecteurs utiles pour l'UI
// Note: Le "stress visible" est une valeur dérivée.
export const selectVisibleStress = (state: HypoxiaState) =>
  Math.min(state.stressLevel + state.permanentDamage, 1);

export const selectCharactersRemaining = (state: HypoxiaState) =>
  Math.max(MAX_CHARS - state.promptText.length, 0);

export const useStore = create<HypoxiaState>()(
  devtools(
    (set, get) => ({
      promptText: '',
      stressLevel: 0,
      permanentDamage: 0,

      setPrompt: (text: string) => {
        const { promptText, permanentDamage } = get();

        // 1. Calcul de la surcharge immédiate
        // On s'assure que le texte ne dépasse pas physiquement la limite si nécessaire, 
        // ou on laisse l'utilisateur déborder (le stress sera > 1 ? Non, borné par la logique).
        // La spec dit maxChars est la limite avant la "mort".
        // Nous allons permettre la saisie mais calculer le stress.

        const newLength = text.length;
        const rawStress = newLength / MAX_CHARS;
        
        // La spec ne dit pas de bloquer la saisie à 200, mais c'est une "limite". 
        // On va assumer que le stress continue de monter ou cap à 1 pour l'immédiat.
        // Spec: "stressLevel (number, 0 à 1)" -> bornons le stress calculé à 1 pour l'état ?
        // Ou laissons-le brut ? "Représente la surcharge immédiate".
        // S'il tape 201 caractères, stress = 1.005. 
        // Je vais borner le stress immédiat calculé à 1 pour respecter le type (0 à 1).
        // Mais pour la mécanique de l'écho, le dépassement est critique.

        const nextStressLevel = rawStress;
        // On ne clamp pas tout de suite si on veut détecter la zone critique précise, 
        // mais pour l'état stocké, respectons 0-1.
        
        const clampedStressLevel = Math.min(rawStress, 1);

        // 2. Mécanique de l'Écho (Permanent Damage)
        // Si on est en Zone Critique (> 0.75) ET qu'on ajoute du texte.
        let nextPermanentDamage = permanentDamage;

        // Détection d'ajout de contenu (frappe)
        const isAddingContent = newLength > promptText.length;
        
        if (nextStressLevel > 0.75 && isAddingContent) {
          // Calcul du delta pour gérer le collage de texte ou la frappe rapide
          const delta = newLength - promptText.length;
          
          // +0.002 par caractère ajouté dans la zone rouge
          const damageIncrement = 0.002 * delta;
          
          nextPermanentDamage = Math.min(permanentDamage + damageIncrement, 0.5);
        }

        set({
          promptText: text,
          stressLevel: clampedStressLevel,
          permanentDamage: nextPermanentDamage,
        });
      },

      reset: () => {
        set({
          promptText: '',
          stressLevel: 0,
          // Note: permanentDamage est... permanent ? 
          // Pour un reset de jeu complet, on remet tout à 0.
          permanentDamage: 0, 
        });
      },
    }),
    { name: 'HypoxiaStore' }
  )
);
