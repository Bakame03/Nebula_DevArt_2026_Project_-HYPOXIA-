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

      {/* 2. MONDE 3D (Background Layers) */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Canvas
          className="w-full h-full"
          camera={{ position: [0, 6, 25], fov: 45 }}
          shadows
        >
          {/* Brume Mystique (Mystic Mist) - Reactive */}
          <color attach="background" args={['#e0e7ff']} />
          <ReactiveFog />

          <SceneLight />
          <ResponsiveCamera />

          {/* Environment Map for Realistic Reflections */}
          <Environment preset="forest" background={false} />

          <Terrain />
          <River />
          <Decorations />
          <Forest />
          <Animals />

          {/* Contact Shadows for Ground Realism */}
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.4}
            scale={100}
            blur={2}
            far={10}
          />

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