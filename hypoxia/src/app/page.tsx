"use client";
import { Canvas } from "@react-three/fiber";
import { useStore } from "@/store/useStore";
import PromptInput from "@/components/ui/PromptInput";
import SoundManager from "@/components/audio/SoundManager";
import ImmersionEffects from "@/components/effects/ImmersionEffects";
import River from "@/components/3d/River";
import Forest from "@/components/3d/Forest";

function SceneLight() {
    const stress = useStore(s => s.stressLevel);
    // La lumière baisse quand le stress monte
    return (
        <>
            <ambientLight intensity={0.5 - (stress * 0.4)} />
            <pointLight position={[10, 10, 10]} intensity={1 - (stress * 0.5)} />
        </>
    )
}

export default function Home() {
  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden select-none">
      
      {/* 1. AUDIO (Invisible) */}
      <SoundManager />

      {/* 2. UI (Au dessus de tout) */}
      <PromptInput />

      {/* 3. MONDE 3D */}
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 5, 20]} />
        
        <SceneLight />
        
        <River />
        <Forest />
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
             <planeGeometry args={[100, 100]} />
             <meshStandardMaterial color="#1e293b" />
        </mesh>

        <ImmersionEffects />
      </Canvas>
    </main>
  );
}