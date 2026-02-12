"use client";
import { Canvas } from "@react-three/fiber";
import { useStore } from "@/store/useStore";
import PromptInput from "@/components/ui/PromptInput";
import SoundManager from "@/components/audio/SoundManager";
import ImmersionEffects from "@/components/effects/ImmersionEffects";
import Terrain from "@/components/3d/Terrain";
import River from "@/components/3d/River";
import Forest from "@/components/3d/Forest";
import Decorations from "@/components/3d/Decorations";

function SceneLight() {
  const stress = useStore(s => s.stressLevel);

  return (
    <>
      {/* Ambiance Mystique (Mystic Mist) */}
      <ambientLight intensity={0.6 - (stress * 0.3)} color="#c7d2fe" />

      {/* Rayons Solaires (God Rays from Top-Left) */}
      <directionalLight
        position={[-50, 40, -40]} // Top-Left-Back
        intensity={2.5 - (stress * 1.0)} // Strong sunlight
        castShadow
        color="#fff7ed" // Warm Sunlight
        shadow-bias={-0.0005}
        shadow-mapSize={[4096, 4096]} // High Res Shadows for God Rays
      >
        <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100]} />
      </directionalLight>
    </>
  )
}

export default function Home() {
  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden select-none">

      {/* 1. AUDIO (Invisible) */}
      <SoundManager />

      {/* 2. MONDE 3D (Background Layers) */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Canvas
          className="w-full h-full"
          camera={{ position: [0, 6, 25], fov: 45 }}
          shadows
        >
          {/* Brume Mystique (Mystic Mist) */}
          <color attach="background" args={['#e0e7ff']} />
          <fog attach="fog" args={['#e0e7ff', 5, 45]} />

          <SceneLight />

          <Terrain />
          <River />
          <Decorations />
          <Forest />

          <ImmersionEffects />
        </Canvas>
      </div>

      {/* 3. UI (Foreground Layer) */}
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        <PromptInput />
      </div>
    </main>
  );
}