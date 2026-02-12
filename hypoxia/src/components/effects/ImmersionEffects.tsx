"use client";
import { EffectComposer, Vignette, Noise, ChromaticAberration, Glitch } from "@react-three/postprocessing";
import { useStore } from "@/store/useStore";
import { Vector2 } from "three";

export default function ImmersionEffects() {
    const { stressLevel, permanentDamage } = useStore();

    // Le niveau total de distorsion
    const totalStress = Math.min(stressLevel + permanentDamage, 1);

    if (totalStress > 0.9) {
        return (
            <EffectComposer enableNormalPass={false}>
                <Vignette eskil={false} offset={0.1} darkness={0.4 + (totalStress * 0.6)} />
                <ChromaticAberration offset={new Vector2(totalStress * 0.005, totalStress * 0.005)} />
                <Noise opacity={0.05 + (permanentDamage * 0.4)} />
                <Glitch delay={new Vector2(0.5, 1)} duration={new Vector2(0.1, 0.3)} strength={new Vector2(0.2, 0.4)} />
            </EffectComposer>
        );
    }

    return (
        <EffectComposer enableNormalPass={false}>
            <Vignette eskil={false} offset={0.1} darkness={0.4 + (totalStress * 0.6)} />
            <ChromaticAberration offset={new Vector2(totalStress * 0.005, totalStress * 0.005)} />
            <Noise opacity={0.05 + (permanentDamage * 0.4)} />
        </EffectComposer>
    );
}