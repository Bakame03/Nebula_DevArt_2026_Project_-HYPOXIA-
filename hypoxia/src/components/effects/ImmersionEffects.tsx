"use client";
import { EffectComposer, Vignette, Noise, ChromaticAberration, Glitch } from "@react-three/postprocessing";
import { useStore } from "@/store/useStore";
import { Vector2 } from "three";

export default function ImmersionEffects() {
  const { stressLevel, permanentDamage } = useStore();
  
  // Le niveau total de distorsion
  const totalStress = Math.min(stressLevel + permanentDamage, 1);

  return (
    <EffectComposer disableNormalPass>
      {/* 1. Vision Tunnel (Asphyxie) */}
      <Vignette 
        eskil={false} 
        offset={0.1} 
        darkness={0.4 + (totalStress * 0.6)} 
      />

      {/* 2. Vertige (Dédoublement des couleurs) */}
      <ChromaticAberration
        offset={new Vector2(totalStress * 0.005, totalStress * 0.005)}
      />

      {/* 3. L'Écho Sale (Cicatrice) */}
      <Noise opacity={0.05 + (permanentDamage * 0.4)} />

      {/* 4. Glitch Critique */}
      <Glitch 
        active={totalStress > 0.9}
        delay={[0.5, 1]} 
        duration={[0.1, 0.3]} 
        strength={[0.2, 0.4]} 
      />
    </EffectComposer>
  );
}