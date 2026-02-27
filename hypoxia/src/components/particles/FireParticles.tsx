"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import seededRandom from "@/utils/seededRandom";

const FIRE_THRESHOLD = 0.85;
const COUNT = 400;

export default function FireParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const rng = useMemo(() => new seededRandom(77341), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      x: (rng.next() - 0.5) * 70,
      z: (rng.next() - 0.5) * 70,
      y: rng.next() * 4,
      speed: 1.5 + rng.next() * 3.0,
      size: 0.06 + rng.next() * 0.12,
      phase: rng.next() * Math.PI * 2,
    }));
  }, [rng]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const stress = useStore.getState().stressLevel;
    const intensity = Math.max(0, (stress - FIRE_THRESHOLD) / (1 - FIRE_THRESHOLD));

    if (intensity < 0.01) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = intensity * 0.55;

    const t = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      p.y += p.speed * delta * intensity;

      // Flicker sideways
      const fx = Math.sin(t * 6.1 + p.phase) * 0.25;
      const fz = Math.cos(t * 4.7 + p.phase + 1.0) * 0.25;

      // Reset when too high — respawn randomly
      if (p.y > 10) {
        p.y = 0;
        p.x = (rng.next() - 0.5) * 70;
        p.z = (rng.next() - 0.5) * 70;
      }

      // Shrink as particle rises (fades out at top)
      const lifeRatio = 1 - p.y / 10;
      const scale = p.size * lifeRatio * intensity;

      dummy.position.set(p.x + fx, p.y, p.z + fz);
      dummy.rotation.z = t * p.speed * 0.5;
      dummy.scale.setScalar(Math.max(0.001, scale));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1]} />
      {/* Color shifts between deep orange and bright yellow via emissive */}
      <meshBasicMaterial
        color="#ff5500"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
