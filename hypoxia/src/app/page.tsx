"use client";

import dynamic from 'next/dynamic';
import PromptInput from '@/components/ui/PromptInput';
import SoundManager from '@/components/audio/SoundManager';
import ImmersionEffects from '@/components/effects/ImmersionEffects';
import AshParticles from '@/components/particles/AshParticles';
import SceneLight from '@/components/3d/SceneLight';
import { Canvas } from '@react-three/fiber';

// Dynamic imports for heavy 3D components to avoid hydration mismatch
const River = dynamic(() => import('@/components/3d/River'), { ssr: false });
const Forest = dynamic(() => import('@/components/3d/Forest'), { ssr: false });

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