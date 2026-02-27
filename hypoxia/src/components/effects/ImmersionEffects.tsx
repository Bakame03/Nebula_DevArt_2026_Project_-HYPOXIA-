"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Vignette, Noise, ChromaticAberration, Glitch, HueSaturation, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { VignetteEffect } from 'postprocessing';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';

export default function ImmersionEffects() {
    const stressLevel = useStore((state) => state.stressLevel);
    const permanentDamage = useStore((state) => state.permanentDamage);

    const vignetteRef = useRef<VignetteEffect>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;

        // Heartbeat shape: two sharp gaussian peaks (lub + dub) then silence
        // Much more realistic than a continuous sine wave
        const heartStress = Math.max(0, Math.min(1, (stressLevel - 0.15) / 0.85));
        const bpm = 55 + heartStress * 75; // 55 → 130 BPM
        const period = 60 / bpm; // seconds per beat
        const phase = (t % period) / period; // 0..1 within beat cycle

        // Lub: gaussian peak at phase 0.08, dub at phase 0.22
        const lub = Math.exp(-Math.pow((phase - 0.08) / 0.030, 2));
        const dub = Math.exp(-Math.pow((phase - 0.22) / 0.025, 2)) * 0.55;
        const beat = Math.min(1, lub + dub);

        const baseDarkness = 0.38 + stressLevel * 0.28;
        const pulseStrength = heartStress * 0.18;

        if (vignetteRef.current) {
            vignetteRef.current.darkness = baseDarkness + beat * pulseStrength;
        }
    });

    const aberrationOffset = useMemo(() => {
        const intensity = stressLevel > 0.6 ? (stressLevel - 0.6) * 0.05 : 0;
        return new THREE.Vector2(intensity, intensity);
    }, [stressLevel]);

    return (
        <>
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