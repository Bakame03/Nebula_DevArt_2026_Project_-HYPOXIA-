"use client";

import React, { useMemo } from 'react';
import { EffectComposer, Vignette, Noise, ChromaticAberration, Glitch } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useStore } from '../../store/useStore'; // À ajuster selon l'arborescence du Dev 1

export default function ImmersionEffects() {
    // 1. Récupération des états dynamiques depuis le store Zustand
    const stressLevel = useStore((state) => state.stressLevel); // Valeur de 0 à 1
    const permanentDamage = useStore((state) => state.permanentDamage); // Valeur de 0 à 1

    // 2. Calcul dynamique de l'aberration chromatique (séparation RGB)
    // On crée un vecteur qui écarte les couleurs uniquement quand le stress est élevé
    const aberrationOffset = useMemo(() => {
        const intensity = stressLevel > 0.6 ? (stressLevel - 0.6) * 0.05 : 0;
        return new THREE.Vector2(intensity, intensity);
    }, [stressLevel]);

    return (
        <EffectComposer>
            {/* EFFET 1 : VIGNETTE (Vision tunnel) */}
            {/* S'assombrit progressivement à mesure que le stress monte */}
            <Vignette
                eskil={false}
                offset={0.5}
                darkness={0.3 + stressLevel * 0.6} // La noirceur passe de 0.3 (calme) à 0.9 (panique)
                blendFunction={BlendFunction.NORMAL}
            />

            {/* EFFET 2 : NOISE (La cicatrice / Trace temporelle) */}
            {/* Ce bruit visuel reste à l'écran même si le stress redescend, basé sur permanentDamage */}
            <Noise
                opacity={permanentDamage > 0 ? permanentDamage * 0.4 : 0}
                blendFunction={BlendFunction.MULTIPLY}
            />

            {/* EFFET 3 : CHROMATIC ABERRATION (Vertige visuel) */}
            {/* Sépare les canaux de couleur pour donner un effet de malaise */}
            <ChromaticAberration
                offset={aberrationOffset}
                blendFunction={BlendFunction.NORMAL}
            />

            {/* EFFET 4 : GLITCH (Surcharge critique du système) */}
            {/* Ne s'active que si l'utilisateur dépasse la limite (stress > 0.9) */}
            <Glitch
                delay={new THREE.Vector2(0.5, 1.5)} // Temps minimum et maximum entre les glitchs
                duration={new THREE.Vector2(0.1, 0.3)} // Durée très courte du glitch
                strength={new THREE.Vector2(0.2, 0.5)} // Force de la déformation
                active={stressLevel > 0.9} // Le déclencheur critique dicté par le store!
                ratio={0.85}
            />
        </EffectComposer>
    );
}