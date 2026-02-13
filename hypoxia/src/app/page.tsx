"use client";
import React from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
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
import Birds from "@/components/3d/Birds";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";

function SceneLight() {
  const stress = useStore(s => s.stressLevel);
  const light = React.useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (light.current) {
      const color = new THREE.Color("#fff7ed").lerp(new THREE.Color("#EF4444"), stress);
      light.current.color = color;
    }
  });

  return (
    <>
      <ambientLight intensity={0.6 - (stress * 0.4)} color="#c7d2fe" />

      <directionalLight
        ref={light}
        position={[-50, 40, -40]} // Top-Left-Back
        intensity={2.5}
        castShadow
        shadow-bias={-0.0005}
        shadow-mapSize={[4096, 4096]}
      >
        <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100]} />
      </directionalLight>
    </>
  )
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useFrame(() => {
    // Only adjust FOV for PerspectiveCamera
    if ('fov' in camera) {
      const aspect = size.width / size.height;

      // Target values based on aspect ratio
      // Wide screen (Desktop): aspect ~1.77 -> FOV 45, Z 25
      // Square (Tablet): aspect ~1.0 -> FOV 55, Z 28
      // Tall screen (Mobile): aspect ~0.5 -> FOV 75, Z 35

      // Interpolation factor based on aspect ratio range [0.5, 2.0]
      // We assume typical range is 0.5 (mobile) to 1.8 (desktop)

      let targetFov = 45;
      let targetZ = 25;
      let targetY = 6;

      if (aspect < 1.0) {
        // Linearly interpolate between Mobile (0.5) and Square (1.0)
        // t = 0 (at 0.5) to 1 (at 1.0)
        const t = Math.min(Math.max((aspect - 0.5) / 0.5, 0), 1);
        targetFov = THREE.MathUtils.lerp(75, 55, t);
        targetZ = THREE.MathUtils.lerp(35, 28, t);
        targetY = THREE.MathUtils.lerp(9, 7, t);
      } else {
        // Linearly interpolate between Square (1.0) and Wide (1.8)
        const t = Math.min(Math.max((aspect - 1.0) / 0.8, 0), 1);
        targetFov = THREE.MathUtils.lerp(55, 45, t);
        targetZ = THREE.MathUtils.lerp(28, 25, t);
        targetY = THREE.MathUtils.lerp(7, 6, t);
      }

      // Smooth damping
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.1);

      camera.updateProjectionMatrix();
    }
  });

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
          <Birds />

          {/* Contact Shadows for Ground Realism */}
          <ContactShadows
            opacity={0.4}
            scale={100}
            blur={2}
            far={10}
            resolution={256}
            color="#000000"
          />

          {/* Post-Processing Effects for Cinematic Look */}
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.5} />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>

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