"use client";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";
import { useStore } from "@/store/useStore";
import { usePrefersReducedMotion } from "@/utils/usePrefersReducedMotion";

interface CinematicCameraProps {
  active: boolean;
}

export default function CinematicCamera({ active }: CinematicCameraProps) {
  const theta = useRef(0);
  const targetPos = useRef(new THREE.Vector3());
  const reducedMotion = usePrefersReducedMotion();

  useFrame((state, delta) => {
    if (!active) return;

    const stress = useStore.getState().stressLevel;
    const t = state.clock.elapsedTime;

    // ── Orbital motion ────────────────────────────────────────────────────
    theta.current += delta * 0.1;
    const radius = 35;
    const baseHeight = 12 + Math.sin(t * 0.2) * 2;

    targetPos.current.set(
      Math.sin(theta.current) * radius,
      baseHeight,
      Math.cos(theta.current) * radius,
    );

    state.camera.position.lerp(targetPos.current, 0.05);

    // Breathing, hyperventilation sway and shake are the vestibular-triggering
    // motions — skip them entirely when the user prefers reduced motion, keeping
    // only the gentle orbit so the scene is still readable in 3D.
    if (!reducedMotion) {
      // ── Breathing — frequency and amplitude rise with heartbeat stress ────
      // Calm: slow deep breaths (0.2 Hz). Panicked: rapid labored (1.5 Hz).
      const breathStress = Math.max(0, stress - 0.1) / 0.9;
      const breathFreq = 0.2 + breathStress * 1.3;
      const breathAmp = 0.06 + breathStress * 0.22;
      const breath = Math.sin(t * breathFreq * Math.PI * 2) * breathAmp;
      state.camera.position.y += breath;

      // Lateral sway at very high stress — hyperventilation
      if (stress > 0.7) {
        const swayT = (stress - 0.7) / 0.3;
        state.camera.position.x += Math.sin(t * 3.7 + 0.5) * 0.035 * swayT;
      }

      // ── Shake at critical stress ────────────────────────────────────────
      const shakeIntensity = Math.max(0, (stress - 0.85) / 0.15) * 0.12;
      if (shakeIntensity > 0) {
        state.camera.position.x += Math.sin(t * 47.3) * shakeIntensity;
        state.camera.position.y += Math.sin(t * 23.7 + 1.2) * shakeIntensity;
      }
    }

    state.camera.lookAt(0, 2, 0);

    if (state.camera instanceof THREE.PerspectiveCamera) {
      state.camera.near = 0.1;
      state.camera.far = 200;
      state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, 50, 0.02);
    }

    state.camera.updateProjectionMatrix();
  });

  return null;
}
