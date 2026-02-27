"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { getTerrainHeight, riverCurve } from "@/utils/terrainLogic";
import seededRandom from "@/utils/seededRandom";

const tempObject = new THREE.Object3D();

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function Forest() {
  const stressLevel = useStore((s) => s.stressLevel);
  const promptText = useStore((s) => s.promptText);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const TREE_COUNT = 200;

  const treeTexture = useTexture("/textures/tree_sprite.png");
  const deadTreeTexture = useTexture("/textures/dead_tree_sprite.png");

  // Progressive death factor: starts at 30 chars (0.5 of 60), fully dead at 60
  const deathFactor = clamp((promptText.length - 20) / 40, 0, 1);

  // Show dead texture only when fully stressed
  const useDeadTexture = deathFactor > 0.75;

  // Progressive color tint: white → yellowing → dead brown
  const treeColor = useMemo(() => {
    if (deathFactor < 0.4) {
      return new THREE.Color(1, 1, 1); // alive
    } else if (deathFactor < 0.75) {
      const t = (deathFactor - 0.4) / 0.35;
      return new THREE.Color(1, 1 - t * 0.45, 1 - t * 0.75); // yellowing
    } else {
      const t = (deathFactor - 0.75) / 0.25;
      return new THREE.Color(0.7 - t * 0.25, 0.45 - t * 0.2, 0.1); // dead brown
    }
  }, [deathFactor]);

  const planeGeo = useMemo(() => new THREE.PlaneGeometry(5, 8), []);

  const trees = useMemo(() => {
    const rng = new seededRandom(67890);
    const valid = [];
    let attempts = 0;
    while (valid.length < TREE_COUNT && attempts < TREE_COUNT * 20) {
      attempts++;
      const x = (rng.next() - 0.5) * 90;
      const z = (rng.next() - 0.5) * 90;

      let minDist = 1000;
      for (let j = 0; j <= 20; j++) {
        const p = riverCurve.getPoint(j / 20);
        const d = Math.hypot(x - p.x, z - p.z);
        if (d < minDist) minDist = d;
      }

      if (minDist > 6) {
        const scale = 0.6 + rng.next() * 1.0;
        const y = getTerrainHeight(x, z);
        valid.push({ x, y, z, scale });
      }
    }
    return valid;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const camera = state.camera;

    // Fade out trees progressively with high stress
    const visibleRatio = Math.max(0, 1 - Math.max(0, stressLevel - 0.8) / 0.2);
    const visibleMax = Math.floor(trees.length * visibleRatio + trees.length * 0.8);

    trees.forEach((tree, i) => {
      const dx = camera.position.x - tree.x;
      const dz = camera.position.z - tree.z;
      const angle = Math.atan2(dx, dz);

      tempObject.position.set(tree.x, tree.y + 4 * tree.scale, tree.z);
      tempObject.rotation.set(0, angle, 0);

      if (i > visibleMax) {
        tempObject.scale.set(0, 0, 0);
      } else {
        tempObject.scale.set(tree.scale, tree.scale, tree.scale);
      }

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Reactively update the material color for progressive death tint
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.color.copy(treeColor);
    mat.map = useDeadTexture ? deadTreeTexture : treeTexture;
    mat.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[planeGeo, undefined, trees.length]}>
      <meshStandardMaterial
        map={treeTexture}
        color={treeColor}
        alphaTest={0.5}
        transparent
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.0}
        envMapIntensity={0.5}
        depthWrite={true}
      />
    </instancedMesh>
  );
}
