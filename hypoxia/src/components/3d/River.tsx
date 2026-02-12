"use client";
import { useStore } from "@/store/useStore";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function River() {
  const { stressLevel } = useStore();
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // L'eau descend avec le stress (1 -> 0.2)
      const targetScale = 1 - (stressLevel * 0.8);
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.1);
      
      // L'eau bouge un peu
      meshRef.current.position.y = -1 + (Math.sin(Date.now() / 1000) * 0.1);
    }
  });

  // Couleur : Bleu vers Marron Boueux
  const color = new THREE.Color("#06b6d4").lerp(new THREE.Color("#5d4037"), stressLevel);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[100, 20]} />
      <meshStandardMaterial color={color} roughness={0.1} metalness={0.8} />
    </mesh>
  );
}