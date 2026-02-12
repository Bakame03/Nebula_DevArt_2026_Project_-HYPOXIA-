# 🫁 HYPOXIA : L'Écho Numérique

> **"Nous ne montrons pas la facture carbone. Nous montrons la blessure."**

![Project Banner](https://via.placeholder.com/1200x400/000000/ff0000?text=HYPOXIA+PREVIEW)
*(Insérez ici une capture d'écran du projet une fois lancé)*

## 🏆 Contexte : DevArt 2026
Ce projet a été réalisé dans le cadre du Hackathon **DevArt 2026**.
* **Thème :** L'Écho / La Trace Temporelle.
* **Sujet :** Impact Environnemental & Identité Visuelle.
* **Concept :** Une expérience de **Survival UI**.

---

## 🌊 Le Concept

**HYPOXIA** n'est pas un site web. C'est une simulation de la "douleur" numérique.
Nous partons du constat que l'utilisateur d'IA est déconnecté de l'impact physique de ses requêtes.

Dans cette expérience :
1.  **L'Action :** L'utilisateur tape un prompt pour générer une image.
2.  **La Conséquence (L'Asphyxie) :** Plus le texte est long, plus l'interface "étouffe". Le champ de vision se rétrécit (Hypoxie), l'écran devient flou, l'air manque (sonore).
3.  **L'Écho (La Cicatrice) :** La rivière s'assèche et la forêt brûle en temps réel. Même si l'utilisateur efface son texte pour "revenir en arrière", **les dégâts ne disparaissent pas totalement**. Une trace visuelle (grain, saleté, arbres morts) persiste à l'écran.

C'est la matérialisation de **l'Écho** : la répercussion d'une onde qui revient vers nous, déformée, après l'action.

---

## 🛠️ Stack Technique (L'Arsenal)

Nous avons utilisé une architecture moderne orientée "Creative Web" pour garantir performance et immersion.

* **Core :** [Next.js 14](https://nextjs.org/) (React)
* **3D Engine :** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (Three.js)
* **VFX / Shaders :** [React Postprocessing](https://docs.pmnd.rs/react-postprocessing) (Vignette, Noise, Glitch, Chromatic Aberration)
* **State Management :** [Zustand](https://github.com/pmndrs/zustand) (Gestion du stress global et des dégâts permanents)
* **Animation 2D :** [Framer Motion](https://www.framer.com/motion/)
* **Audio Engine :** [Howler.js](https://howlerjs.com/)

---

## 🚀 Installation & Démarrage

Pour tester l'expérience en local :

bash
# 1. Cloner le projet
git clone [https://github.com/VOTRE_NOM/hypoxia.git](https://github.com/VOTRE_NOM/hypoxia.git)
cd hypoxia

# 2. Installer les dépendances (Arsenal)
npm install

# 3. Lancer le serveur de développement
npm run dev



Ouvrez [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) et mettez votre casque audio 🎧.

## 👥 L'Équipe (La Team)

* **Membre 1 :** Lead Architect & UI (Le Cerveau)
* **Membre 2 :** 3D Environment Artist (Le Monde)
* **Membre 3 :** VFX & Shader Master (L'Immersion)
* **Membre 4 :** Sound Engineer & Data Logic (L'Angoisse)

---

## 🎨 Fonctionnalités Clés à Tester

1. **Tapez du texte :** Observez la vignette noire (Vision Tunnel) apparaître.
2. **Saturez le système :** Tapez plus de 100 caractères pour déclencher le **GLITCH CRITIQUE**.
3. **Écoutez :** La respiration s'accélère et devient paniquée.
4. **Effacez tout :** Regardez l'écran. Il reste sale et gris. C'est l'Écho de votre passage.

---

> *"Le silence régénère. La donnée détruit."*




This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Code Explanations for each member

# 📜 PROTOCOLE "HYPOXIA" : GUIDE DE DÉVELOPPEMENT & RÉPARTITION

## 1. L'ARCHITECTURE DU PROJET (La Carte)

**Arborescence des fichiers à respecter :**

```text
/src
  /app
    page.tsx             <-- (Zone Commune - Assemblage final par DEV 1)
    layout.tsx           <-- (Zone Commune)
  /store
    useStore.ts          <-- (DEV 1) Le Cerveau (Zustand)
  /components
    /ui                  <-- (DEV 1) Interface 2D
      PromptInput.tsx
      HypoxiaOverlay.tsx
    /3d                  <-- (DEV 2) Environnement 3D
      River.tsx
      Forest.tsx
    /effects             <-- (DEV 3) Post-Processing
      ImmersionEffects.tsx
    /audio               <-- (DEV 4) Son
      SoundManager.tsx


### 👤 DEV 1 : L'ARCHITECTE & UI (Chef des Opérations)

**Responsabilité :** Tu crées le "Cerveau" (Store) et l'Interface de saisie (Input). C'est toi qui définis les règles du jeu (Stress, Dégâts permanents).
**Tes Fichiers :** `src/store/useStore.ts`, `src/components/ui/PromptInput.tsx`

**Ton Prompt pour l'IA :**

> "Agis comme un expert React/Zustand. Crée un store global `src/store/useStore.ts`.
> Il doit contenir :
> 1. `promptText` (string)
> 2. `stressLevel` (number 0-1) : calculé en fonction de la longueur du texte.
> 3. `permanentDamage` (number 0-1) : C'est la "Cicatrice". Si le stress dépasse 0.8, cette valeur augmente irréversiblement.
> Crée ensuite un composant `PromptInput.tsx` utilisant Framer Motion qui fait trembler l'input quand le stress est haut et affiche une alerte rouge si stress > 0.9."
> 
> 

---

### 👤 DEV 2 : LE CONSTRUCTEUR DE MONDE (3D Environment)

**Responsabilité :** Tu crées la rivière qui sèche et la forêt qui brûle. Ta scène doit réagir au `stressLevel`.
**Tes Fichiers :** `src/components/3d/River.tsx`, `src/components/3d/Forest.tsx`

**Ton Prompt pour l'IA :**

> "Agis comme un expert Three.js et React Three Fiber.
> Je veux deux composants : `River.tsx` et `Forest.tsx`.
> Ils doivent s'abonner au store Zustand (`useStore`) pour récupérer `stressLevel` et `permanentDamage`.
> 1. La Rivière : Doit être un Mesh plan bleu qui devient marron/boueux et dont le scale Y diminue quand le stress augmente.
> 2. La Forêt : Doit être un groupe de cônes (arbres low poly). Quand le stress monte, leur couleur passe de Vert à Noir (brûlé).
> Utilise `@react-three/drei` pour les matériaux si besoin."
> 
> 

---

### 👤 DEV 3 : LE MAÎTRE DES EFFETS (VFX & Post-Processing)

**Responsabilité :** Tu crées l'asphyxie visuelle. Le flou, la vignette noire, le glitch. C'est toi qui rends l'expérience "douloureuse".
**Tes Fichiers :** `src/components/effects/ImmersionEffects.tsx`

**Ton Prompt pour l'IA :**

> "Agis comme un expert en Shaders et React Three Postprocessing.
> Crée le composant `ImmersionEffects.tsx` à placer dans un Canvas R3F.
> Récupère `stressLevel` et `permanentDamage` depuis le store Zustand.
> Combine ces effets :
> 1. `Vignette` : Devient plus sombre et intense avec le stress (Vision tunnel).
> 2. `Noise` : Augmente l'opacité avec `permanentDamage` (Effet sale/cicatrice).
> 3. `ChromaticAberration` : Sépare les couleurs RGB quand le stress est critique (Vertige).
> 4. `Glitch` : S'active uniquement si stress > 0.9."
> 
> 

---

### 👤 DEV 4 : L'INGÉNIEUR SONORE (Sound Design)

**Responsabilité :** L'immersion auditive. Le son de respiration qui s'accélère. C'est crucial pour l'angoisse.
**Tes Fichiers :** `src/components/audio/SoundManager.tsx` (+ trouver un mp3 de respiration).

**Ton Prompt pour l'IA :**

> "Agis comme un expert React et Howler.js.
> Crée un composant invisible `SoundManager.tsx`.
> Il doit charger un fichier son `/sounds/breathing.mp3` en boucle.
> Abonne-toi au store Zustand (`stressLevel`).
> Logique :
> * Plus le stress monte, plus le `rate` (vitesse) de lecture augmente (jusqu'à x2.5).
> * Plus le stress monte, plus le `volume` augmente.
> Gère proprement le `useEffect` pour charger/décharger le son."
> 
> 

