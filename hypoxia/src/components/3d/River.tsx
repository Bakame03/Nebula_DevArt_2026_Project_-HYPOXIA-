"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { riverCurve } from "@/utils/terrainLogic";

export default function River() {
  const { stressLevel } = useStore();
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    // TubeGeometry flattened
    const geo = new THREE.TubeGeometry(riverCurve, 64, 3.5, 8, false);
    return geo;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const waterHeight = 1.0 * (1 - stressLevel * 0.9);

      meshRef.current.scale.y = 0.05 * (1 - stressLevel * 0.8);
      meshRef.current.position.y = -1.8 + (waterHeight * 0.5);
    }
  });

  // Couleur : Eau Claire et Bleutée (Mystic River) -> Boueuse si stress
  const color = new THREE.Color("#60a5fa").lerp(new THREE.Color("#4e342e"), stressLevel);
  // Aspect : Très lisse et clair (Glass-like)
  const roughness = 0.1 + (stressLevel * 0.7); // Smooth -> Rough
  const metalness = 0.2 - (stressLevel * 0.1); // Slightly reflective

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[0, 0, 0]}>
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        side={THREE.DoubleSide}
        transparent={true}
        opacity={0.6}
      />
    </mesh>
  );
}