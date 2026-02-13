"use client";
import React from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { useStore } from "@/store/useStore";
import PromptInput from "@/components/ui/PromptInput";
import SoundManager from "@/components/audio/SoundManager";
import ImmersionEffects from "@/components/effects/ImmersionEffects";
import Terrain from "@/components/3d/Terrain";
import River from "@/components/3d/River";
import Forest from "@/components/3d/Forest";
import Decorations from "@/components/3d/Decorations";
import Animals from "@/components/3d/Animals";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";

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

function ResponsiveCamera() {
  const { camera, size } = useThree();

  React.useEffect(() => {
    // Only adjust FOV for PerspectiveCamera
    if ('fov' in camera) {
      const aspect = size.width / size.height;

      // Adjust FOV and Position for different screen sizes to keep the scene in view
      if (aspect < 0.8) {
        // Mobile Portrait (Phone)
        camera.fov = 65;
        camera.position.set(0, 8, 32);
      } else if (aspect < 1.2) {
        // Tablet / Square-ish
        camera.fov = 55;
        camera.position.set(0, 7, 28);
      } else {
        // Desktop / Landscape
        camera.fov = 45;
        camera.position.set(0, 6, 25);
      }

      camera.updateProjectionMatrix();
    }
  }, [camera, size]);

  return null;
}

function ReactiveFog() {
  const stress = useStore(s => s.stressLevel);

  // Fog logic:
  // Low Stress (High Water) -> Clear View (fog far away)
  // High Stress (Low Water) -> Dense Fog (fog close)
  const near = 20 - (stress * 18); // 20 -> 2
  const far = 120 - (stress * 90); // 120 -> 30
  const color = '#e0e7ff';

  return <fog attach="fog" args={[color, near, far]} />;
}

export default function Home() {
  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden select-none">

      {/* 1. AUDIO (Invisible) */}
      <SoundManager />

      {/* 2. UI (Au dessus de tout) */}
      <PromptInput />

      {/* 3. MONDE 3D */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
          {/* BACKGROUND */}
          <color attach="background" args={['#020617']} />

          {/* FOG defaults (Overridden by ImmersionEffects if needed, but good baseline) */}
          <fog attach="fog" args={['#020617', 5, 20]} />

          {/* LIGHTING */}
          <SceneLight />

          {/* ENVIRONMENT */}
          <River />
          <Forest />
          <Animals />

          {/* INFINITE FLOOR (Dark) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>

          {/* PHASE 3: PARTICULES DE CENDRE */}
          <AshParticles />

          {/* POST-PROCESSING */}
          <ImmersionEffects />
        </Canvas>
      </div>
    </main>
  );
}