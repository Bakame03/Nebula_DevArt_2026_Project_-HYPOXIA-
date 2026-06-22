"use client";

import { useRef, useMemo, type ReactElement } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Vignette, Noise, ChromaticAberration, Glitch, HueSaturation, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { VignetteEffect } from 'postprocessing';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';
import { bpmFromStress, beatEnvelope } from '@/utils/heartbeat';

export default function ImmersionEffects() {
    const stressLevel = useStore((state) => state.stressLevel);
    const permanentDamage = useStore((state) => state.permanentDamage);

    const vignetteRef = useRef<VignetteEffect>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;

        // Beat timing comes from the shared heartbeat model so the vignette
        // pulse stays locked to the same BPM as the EKG, the readout and the audio.
        const period = 60 / bpmFromStress(stressLevel); // seconds per beat
        const phase = (t % period) / period; // 0..1 within beat cycle
        const beat = beatEnvelope(phase);

        // pulseStrength fades the throb in only once stress is meaningful.
        const heartStress = Math.max(0, Math.min(1, (stressLevel - 0.15) / 0.85));
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

    // Coarse one-time capability check. Phones / low-core machines skip the
    // separate-pass effects entirely (Bloom's mipmap blur is the heaviest).
    const lowPower = useMemo(() => {
        if (typeof window === 'undefined') return false;
        const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
        const mobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
        return coarse || mobileUA || fewCores;
    }, []);

    // The merged pass (Vignette + Noise + HueSaturation + ChromaticAberration)
    // is one fullscreen draw and stays. Bloom and Glitch are extra passes, so
    // gate them on coarse thresholds — these flip at most a few times a session,
    // not per frame. Glitch mounts at 0.75, ahead of its 0.9 activation, so it's
    // already warm when the climax hits instead of hitching there.
    const showBloom = !lowPower && stressLevel > 0.12;
    const showAberration = !lowPower && stressLevel > 0.6;
    const showGlitch = !lowPower && stressLevel > 0.75;
    const hasScar = permanentDamage > 0.001;

    // EffectComposer types its children as ReactElement[], so we build a keyed
    // array and drop the inactive passes rather than passing `false` children.
    const passes: (ReactElement | false)[] = [
        showBloom && (
            <Bloom
                key="bloom"
                intensity={stressLevel * 1.0}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
                mipmapBlur
            />
        ),
        hasScar && <HueSaturation key="hue" saturation={-permanentDamage * 2} />,
        <Vignette
            key="vignette"
            ref={vignetteRef}
            eskil={false}
            offset={0.3}
            blendFunction={BlendFunction.NORMAL}
        />,
        hasScar && (
            <Noise key="noise" opacity={permanentDamage * 0.4} blendFunction={BlendFunction.MULTIPLY} />
        ),
        showAberration && (
            <ChromaticAberration key="aberration" offset={aberrationOffset} blendFunction={BlendFunction.NORMAL} />
        ),
        showGlitch && (
            <Glitch
                key="glitch"
                delay={new THREE.Vector2(0.5, 1.5)}
                duration={new THREE.Vector2(0.1, 0.3)}
                strength={new THREE.Vector2(0.2, 0.5)}
                active={stressLevel > 0.9}
                ratio={0.85}
            />
        ),
    ];

    return (
        <EffectComposer>
            {passes.filter((p): p is ReactElement => Boolean(p))}
        </EffectComposer>
    );
}