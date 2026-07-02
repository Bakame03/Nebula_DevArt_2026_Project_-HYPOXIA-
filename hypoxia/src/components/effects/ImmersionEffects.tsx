"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Vignette, Noise, ChromaticAberration, Glitch, HueSaturation, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

export default function ImmersionEffects() {
    const stressLevel = useStore((state) => state.stressLevel);
    const permanentDamage = useStore((state) => state.permanentDamage);

    // Refs
    const vignetteRef = useRef<any>(null);
    const fogRef = useRef<THREE.Fog>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;

        // --- AUDIO SYNC PULSE ---
        const heartStress = Math.max(0, Math.min(1, (stressLevel - 0.3) / 0.7));
        const heartRate = 0.6 + (heartStress * heartStress * 1.9);
        const pulseSpeed = heartRate * 5;

        const baseDarkness = 0.4 + (stressLevel * 0.3);
        const pulseStrength = heartStress * 0.15;
        const pulse = (Math.sin(t * pulseSpeed) + 1) / 2;

        if (vignetteRef.current) {
            vignetteRef.current.darkness = baseDarkness + (pulse * pulseStrength);
        }

        // --- TOXIC FOG (Re-implemented safely) ---
        if (fogRef.current) {
            const fog = fogRef.current;

            // Color: Deep Blue -> Red/Black
            const baseColor = new THREE.Color("#020617");
            const toxicColor = new THREE.Color("#1a0505");
            fog.color.lerpColors(baseColor, toxicColor, stressLevel * 1.2);

            // Density
            fog.near = 5 - (stressLevel * 3);
            fog.far = 20 - (stressLevel * 10);
        }
    });

    const aberrationOffset = useMemo(() => {
        const intensity = stressLevel > 0.6 ? (stressLevel - 0.6) * 0.05 : 0;
        return new THREE.Vector2(intensity, intensity);
    }, [stressLevel]);

    return (
        <>
            {/* TENTE DE REMPLACER LE FOG GLOBAL PAR CELUI-CI */}
            {/* <fog ref={fogRef} attach="fog" args={['#020617', 5, 20]} /> */}

            <EffectComposer>
                <Bloom
                    intensity={stressLevel * 1.0}
                    luminanceThreshold={0.2}
                    luminanceSmoothing={0.9}
                    mipmapBlur
                />
                <HueSaturation saturation={-permanentDamage * 2} />
                <Vignette
                    ref={vignetteRef}
                    eskil={false}
                    offset={0.3}
                    blendFunction={BlendFunction.NORMAL}
                />
                <Noise
                    opacity={permanentDamage > 0 ? permanentDamage * 0.4 : 0}
                    blendFunction={BlendFunction.MULTIPLY}
                />
                <ChromaticAberration
                    offset={aberrationOffset}
                    blendFunction={BlendFunction.NORMAL}
                />
                <Glitch
                    delay={new THREE.Vector2(0.5, 1.5)}
                    duration={new THREE.Vector2(0.1, 0.3)}
                    strength={new THREE.Vector2(0.2, 0.5)}
                    active={stressLevel > 0.9}
                    ratio={0.85}
                />
            </EffectComposer>
        </>
    );
}