"use client";
import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Environment, ContactShadows, PerformanceMonitor } from "@react-three/drei";
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
import AshParticles from "@/components/particles/AshParticles";
import CinematicCamera from "@/components/utils/CinematicCamera";
import LoadingScreen from "@/components/ui/LoadingScreen";
import IntroScreen from "@/components/ui/IntroScreen";
import EndScreen from "@/components/ui/EndScreen";
import NarrativeMessages from "@/components/ui/NarrativeMessages";
import HelpPanel from "@/components/ui/HelpPanel";
import FaviconManager from "@/components/ui/FaviconManager";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import CustomCursor from "@/components/ui/CustomCursor";
import GlobalCO2Ticker from "@/components/ui/GlobalCO2Ticker";
import ReactiveSky from "@/components/3d/ReactiveSky";
import FireParticles from "@/components/particles/FireParticles";
import AcidRain from "@/components/particles/AcidRain";
import DegradedAI from "@/components/ui/DegradedAI";
import WhisperVoices from "@/components/ui/WhisperVoices";
import RecoveryManager from "@/components/ui/RecoveryManager";
import ExtinctSpecies from "@/components/ui/ExtinctSpecies";

// ─── Scene sub-components ─────────────────────────────────────────────────────

function SceneLight() {
  const stress = useStore((s) => s.stressLevel);

  return (
    <>
      <ambientLight intensity={0.6 - stress * 0.3} color="#c7d2fe" />
      {/* No castShadow: nothing in the scene casts into a directional shadow
          map (trees/rocks/deer/birds are instanced with castShadow off), so the
          real-time shadow pass produced nothing visible. Grounding comes from
          <ContactShadows> instead. */}
      <directionalLight
        position={[-50, 40, -40]}
        intensity={2.5 - stress * 1.0}
        color="#fff7ed"
      />
    </>
  );
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useFrame(() => {
    if (!("fov" in camera)) return;
    const aspect = size.width / size.height;

    let targetFov = 45;
    let targetZ = 25;
    let targetY = 6;

    if (aspect < 1.0) {
      const t = Math.min(Math.max((aspect - 0.5) / 0.5, 0), 1);
      targetFov = THREE.MathUtils.lerp(75, 55, t);
      targetZ = THREE.MathUtils.lerp(35, 28, t);
      targetY = THREE.MathUtils.lerp(9, 7, t);
    } else {
      const t = Math.min(Math.max((aspect - 1.0) / 0.8, 0), 1);
      targetFov = THREE.MathUtils.lerp(55, 45, t);
      targetZ = THREE.MathUtils.lerp(28, 25, t);
      targetY = THREE.MathUtils.lerp(7, 6, t);
    }

    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.1);
    camera.updateProjectionMatrix();
  });

  return null;
}

const CLEAR_FOG = new THREE.Color("#c7d5ff");
const TOXIC_FOG = new THREE.Color("#2a0303");

function ReactiveFog() {
  const { scene } = useThree();
  const fogRef = useRef<THREE.Fog | null>(null);

  useEffect(() => {
    const fog = new THREE.Fog(CLEAR_FOG.clone(), 20, 120);
    fogRef.current = fog;
    scene.fog = fog;
    return () => { scene.fog = null; };
  }, [scene]);

  useFrame(() => {
    if (!fogRef.current) return;
    const s = useStore.getState().stressLevel;
    fogRef.current.near = 20 - s * 18;
    fogRef.current.far = Math.max(30, 120 - s * 90);
    fogRef.current.color.lerpColors(CLEAR_FOG, TOXIC_FOG, s);
  });

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [cinematicMode, setCinematicMode] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);
  // Adaptive resolution ceiling. dpr={[1, dprMax]} clamps to the device's real
  // pixel ratio but never exceeds dprMax — caps high-DPR phones (were rendering
  // at ~3×) without supersampling DPR-1 laptops. PerformanceMonitor lowers it
  // when the framerate drops; the fallback floor stops it oscillating.
  const [dprMax, setDprMax] = useState(2);
  const hasReachedMax = useStore((s) => s.hasReachedMax);
  const reset = useStore((s) => s.reset);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!introComplete) return;
      const key = e.key.toLowerCase();
      if (key === "c") setCinematicMode((p) => !p);
      if (key === "r") reset();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [introComplete, reset]);

  // After hydration from localStorage, ensure stressLevel reflects persisted scar.
  useEffect(() => {
    const { permanentDamage, stressLevel } = useStore.getState();
    if (permanentDamage > stressLevel) {
      useStore.setState({ stressLevel: permanentDamage });
    }
  }, []);

  const handleIntroStart = useCallback(() => {
    setIntroComplete(true);
  }, []);

  const toggleCinematic = useCallback(() => {
    setCinematicMode((p) => !p);
  }, []);

  return (
    <main className="relative w-screen h-screen bg-[#020617] overflow-hidden select-none">
      <SoundManager />
      <FaviconManager />
      <CustomCursor />

      {/* ── 3D Canvas ─────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <ErrorBoundary>
        <Canvas
          className="w-full h-full"
          dpr={[1, dprMax]}
          camera={{ position: [0, 6, 25], fov: 45 }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true, // required for canvas screenshot
          }}
        >
          {/* Adaptive resolution: drop the DPR ceiling when fps sags, with a
              hard floor (1.0) after repeated declines so it can't oscillate. */}
          <PerformanceMonitor
            flipflops={3}
            onChange={({ factor }) => setDprMax(Math.round((1 + factor) * 2) / 2)}
            onFallback={() => setDprMax(1)}
          />
          <ReactiveFog />
          <SceneLight />

          {!cinematicMode && <ResponsiveCamera />}
          {cinematicMode && <CinematicCamera active={cinematicMode} />}

          <Suspense fallback={null}>
            <ReactiveSky />
            <Environment preset="forest" background={false} />
            <Terrain />
            <River />
            <Decorations />
            <Forest />
            <Animals />
            <Birds />
          </Suspense>

          <ContactShadows
            opacity={0.4}
            scale={100}
            blur={2}
            far={10}
            resolution={256}
            color="#000000"
          />

          <AshParticles />
          <AcidRain />
          <FireParticles />
          <ImmersionEffects />
        </Canvas>
        </ErrorBoundary>
      </div>

      {/* ── HTML Overlay Layer ────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        {introComplete && (
          <>
            <DegradedAI />
            <NarrativeMessages />
            <ExtinctSpecies />
            <GlobalCO2Ticker />
            <RecoveryManager />
            <WhisperVoices />
            <PromptInput
              cinematicMode={cinematicMode}
              onToggleCinematic={toggleCinematic}
            />
            <HelpPanel />
          </>
        )}
      </div>

      {/* ── Modals & screens ─────────────────────────────────────────────── */}
      <LoadingScreen />
      <IntroScreen onStart={handleIntroStart} />
      <EndScreen visible={hasReachedMax && introComplete} />
    </main>
  );
}
