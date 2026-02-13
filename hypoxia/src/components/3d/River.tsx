"use client";
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { riverCurve } from "@/utils/terrainLogic";
import { useStore } from "@/store/useStore";

export default function River() {
  const { stressLevel } = useStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // ── Load Water Normal Map ──────────────────────────────────────────────
  const waterNormals = useTexture(
    "/textures/waternormals.jpg"
  );

  // ── Configure Texture (runs once after load) ──────────────────────────
  useMemo(() => {
    waterNormals.wrapS = THREE.RepeatWrapping;
    waterNormals.wrapT = THREE.RepeatWrapping;
    waterNormals.repeat.set(4, 1); // Stretch along current direction
  }, [waterNormals]);

  // ── Tube Geometry along the river curve ───────────────────────────────
  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(riverCurve, 200, 5, 20, false);
  }, []);

  // ── Stress-reactive color ─────────────────────────────────────────────
  const cleanColor = useMemo(() => new THREE.Color("#22d3ee"), []); // Cyan 400
  const stressColor = useMemo(() => new THREE.Color("#ef4444"), []); // Red 500
  const currentColor = useMemo(() => new THREE.Color(), []);

  // ── Animation Loop ────────────────────────────────────────────────────
  useFrame((_, delta) => {
    // 1. Animate texture offset → flowing water illusion
    waterNormals.offset.x += delta * 0.5;

    // 2. Update material color based on stress
    if (materialRef.current) {
      currentColor.copy(cleanColor).lerp(stressColor, stressLevel);
      materialRef.current.color.copy(currentColor);
    }

    // 3. Flatten + position the mesh
    if (meshRef.current) {
      meshRef.current.scale.y = 0.1; // Flat ribbon
      meshRef.current.scale.x = 1.0;

      // Drought effect: water level drops with stress
      // Level -1.5 (High) → -3.5 (Low)
      meshRef.current.position.y = -1.5 - stressLevel * 2.0;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[0, 0, 0]}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial
        ref={materialRef}
        color="#22d3ee"
        normalMap={waterNormals}
        normalScale={new THREE.Vector2(0.5, 0.5)}
        roughness={0.1}
        metalness={0.8}
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
