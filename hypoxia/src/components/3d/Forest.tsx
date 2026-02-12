"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo } from "react";
import * as THREE from "three";

export default function Forest() {
  const { stressLevel, permanentDamage } = useStore();
  
  // Génère 50 arbres aléatoires une seule fois
  const trees = useMemo(() => {
    return new Array(50).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 40,
      z: (Math.random() - 0.5) * 20 - 5, // Un peu en arrière
      scale: 0.5 + Math.random() * 1.5
    }));
  }, []);

  // Couleur : Vert -> Noir (Brûlé)
  // On utilise permanentDamage ici pour montrer que la forêt ne repousse pas !
  const burnLevel = Math.min(stressLevel + permanentDamage, 1);
  const color = new THREE.Color("#10b981").lerp(new THREE.Color("#1a1a1a"), burnLevel);

  return (
    <group>
      {trees.map((tree, i) => (
        <mesh key={i} position={[tree.x, 0, tree.z]} scale={[1, tree.scale, 1]}>
          <coneGeometry args={[1, 4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}