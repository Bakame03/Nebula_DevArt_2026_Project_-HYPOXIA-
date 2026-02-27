"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import seededRandom from "@/utils/seededRandom";

const RAIN_START_STRESS = 0.45;
const COUNT = 900;

export default function AcidRain() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const rng = useMemo(() => new seededRandom(55123), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Thin elongated box — looks like a falling raindrop streak
  const geo = useMemo(() => new THREE.BoxGeometry(0.018, 0.7, 0.018), []);

  const particles = useMemo(() =>
    Array.from({ length: COUNT }, () => ({
      x: (rng.next() - 0.5) * 110,
      z: (rng.next() - 0.5) * 110,
      y: rng.next() * 35,
      speed: 9 + rng.next() * 9,
      drift: (rng.next() - 0.5) * 0.8, // lateral wind drift
    })),
  [rng]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const stress = useStore.getState().stressLevel;
    const intensity = Math.max(0, (stress - RAIN_START_STRESS) / (1 - RAIN_START_STRESS));

    if (intensity < 0.01) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.min(intensity * 0.55, 0.5);

    particles.forEach((p, i) => {
      p.y -= p.speed * delta * intensity;
      p.x += p.drift * delta;

      if (p.y < -3) {
        p.y = 32 + Math.random() * 6;
        p.x = (rng.next() - 0.5) * 110;
        p.z = (rng.next() - 0.5) * 110;
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, COUNT]}>
      {/* Acid yellow-green, semi-transparent */}
      <meshBasicMaterial
        color="#a8ff3e"
        transparent
        opacity={0}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
