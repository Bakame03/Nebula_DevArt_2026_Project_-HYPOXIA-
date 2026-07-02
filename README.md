# Live Test Link : https://nebula-gray-seven.vercel.app/

# Nebula_DevArt_2026_Project_-HYPOXIA-
HYPOXIA | L'Écho Numérique. Une expérience immersive de survie qui révèle le coût invisible de l'IA. Tapez un prompt, et regardez le monde étouffer. 🌿🔥 (DevArt 2026 Project - Next.js + R3F)




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

---

## 📂 Architecture du Projet

Pour faciliter la collaboration, le projet est divisé en modules étanches :

text
/src
  /store           # LE CERVEAU
    └── useStore.ts      # Gestion du stress et de la "Cicatrice" (Écho)
  /components
    /3d            # L'ENVIRONNEMENT
      ├── River.tsx      # La rivière qui s'assèche
      ├── Forest.tsx     # La forêt qui brûle
      └── Effects.tsx    # Les Shaders (Flou, Glitch, Asphyxie)
    /ui            # L'INTERFACE
      └── PromptInput.tsx # L'input qui tremble et réagit
    /audio         # LE SON
      └── SoundManager.tsx # Gestion de la respiration dynamique



---

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
