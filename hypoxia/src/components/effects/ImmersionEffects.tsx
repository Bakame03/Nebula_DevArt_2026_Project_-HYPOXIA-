"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Vignette, Noise, ChromaticAberration, Glitch, HueSaturation, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useStore } from '../../store/useStore'; // À ajuster selon l'arborescence du Dev 1

export default function ImmersionEffects() {
    // 1. Récupération des états dynamiques depuis le store Zustand
    const stressLevel = useStore((state) => state.stressLevel); // Valeur de 0 à 1
    const permanentDamage = useStore((state) => state.permanentDamage); // Valeur de 0 à 1

    // 2. Refs pour l'animation (Panic Pulse)
    const vignetteRef = useRef<any>(null);

    // 3. Logic "Panic Pulse" (Battement de coeur visuel)
    useFrame((state) => {
        if (!vignetteRef.current) return;

        const t = state.clock.elapsedTime;

        // Vitesse du pouls : Calme (2Hz) -> Panique (8Hz)
        const speed = 2 + (stressLevel * 6);

        // Obscurité de base : Augmente avec le stress (0.4 -> 0.7)
        const baseDarkness = 0.4 + (stressLevel * 0.3);

        // Intensité du battement : Visible uniquement après 50% de stress
        const pulseStrength = stressLevel > 0.5 ? (stressLevel - 0.5) * 0.4 : 0;

        // Onde sinusoïdale (0 à 1)
        const pulse = (Math.sin(t * speed) + 1) / 2;

        // Application directe sur la ref (Performance optimale)
        vignetteRef.current.darkness = baseDarkness + (pulse * pulseStrength);
    });

    // 4. Calcul dynamique de l'aberration chromatique
    const aberrationOffset = useMemo(() => {
        const intensity = stressLevel > 0.6 ? (stressLevel - 0.6) * 0.05 : 0;
        return new THREE.Vector2(intensity, intensity);
    }, [stressLevel]);

    return (
        <EffectComposer>
            {/* EFFET 5 : HYPOXIA GLOW (Bloom/Fainting) */}
            {/* LUEUR D'ASPHYXIE - S'active quand le stress monte, donnant un aspect "flou/rêve" */}
            <Bloom
                intensity={stressLevel * 1.0} // Augmente avec le stress
                luminanceThreshold={0.2}      // Seules les parties brillantes (texte, néons) brillent
                luminanceSmoothing={0.9}
                mipmapBlur                    // Flou doux de haute qualité
            />

            {/* EFFET 6 : DIGITAL DESATURATION (L'Echo) */}
            {/* LE MONDE MEURT - Saturation baisse avec les dégâts permanents */}
            <HueSaturation
                saturation={-permanentDamage * 2} // 0 -> -1 (Noir et Blanc à 50% de dégâts)
            />

            {/* EFFET 1 : PANIC PULSE VIGNETTE */}
            {/* CERCLE DE VISION - Animé par useFrame ci-dessus pour battre comme un coeur */}
            <Vignette
                ref={vignetteRef}
                eskil={false}
                offset={0.3} // Plus serré pour effet claustrophobique
                // darkness est géré par useFrame
                blendFunction={BlendFunction.NORMAL}
            />

            {/* EFFET 2 : NOISE (La cicatrice) */}
            <Noise
                opacity={permanentDamage > 0 ? permanentDamage * 0.4 : 0}
                blendFunction={BlendFunction.MULTIPLY}
            />

            {/* EFFET 3 : VERTIGO (Chromatic Aberration) */}
            <ChromaticAberration
                offset={aberrationOffset}
                blendFunction={BlendFunction.NORMAL}
            />

            {/* EFFET 4 : GLITCH (Surcharge critique) */}
            <Glitch
                delay={new THREE.Vector2(0.5, 1.5)}
                duration={new THREE.Vector2(0.1, 0.3)}
                strength={new THREE.Vector2(0.2, 0.5)}
                active={stressLevel > 0.9}
                ratio={0.85}
            />
        </EffectComposer>
    );
}