"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import { getTerrainHeight, riverCurve } from "@/utils/terrainLogic";
import seededRandom from "@/utils/seededRandom";

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export default function Forest() {
  const { stressLevel, permanentDamage } = useStore();
  const trunkMesh = useRef<THREE.InstancedMesh>(null);
  const foliageMesh = useRef<THREE.InstancedMesh>(null);

  const TREE_COUNT = 200; // Denser forest
  const FOLIAGE_PER_TREE = 4; // More lush foliage

  // Generate valid tree positions
  const trees = useMemo(() => {
    // Local generator
    const rng = new seededRandom(67890);
    const validTrees = [];
    let attempts = 0;

    while (validTrees.length < TREE_COUNT && attempts < TREE_COUNT * 20) {
      attempts++;
      const x = (rng.next() - 0.5) * 90;
      const z = (rng.next() - 0.5) * 90;

      let minDist = 1000;
      for (let j = 0; j <= 20; j++) {
        const point = riverCurve.getPoint(j / 20);
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
        if (dist < minDist) minDist = dist;
      }

      if (minDist > 6) {
        const scale = 0.8 + rng.next() * 1.2;
        const y = getTerrainHeight(x, z);
        const type = rng.next();
        validTrees.push({ x, y, z, scale, type });
      }
    }
    return validTrees;
  }, []);

  // Update layout (Static, lush forest)
  useLayoutEffect(() => {
    if (!trunkMesh.current || !foliageMesh.current) return;

    // Local generator for layout effect
    const rng = new seededRandom(13579);

    // RESTORED: No burn level, always healthy
    // const burnLevel = Math.min(stressLevel + permanentDamage, 1);

    let foliageIndex = 0;

    trees.forEach((tree, i) => {
      // 1. TRUNK
      tempObject.position.set(tree.x, tree.y + (1 * tree.scale), tree.z);
      tempObject.scale.set(tree.scale, tree.scale, tree.scale);
      tempObject.rotation.set(0, rng.next() * Math.PI, 0);
      tempObject.updateMatrix();
      trunkMesh.current!.setMatrixAt(i, tempObject.matrix);

      // Trunk Color: Always Brown (#3e2723)
      const baseTrunk = new THREE.Color("#3e2723");
      trunkMesh.current!.setColorAt(i, baseTrunk);

      // 2. FOLIAGE
      // Base Color Calculation
      let baseFoliage;
      // Natural, lush greens (Reverted from vibrant)
      if (tree.type < 0.3) baseFoliage = new THREE.Color("#22c55e"); // Green 500
      else if (tree.type < 0.6) baseFoliage = new THREE.Color("#16a34a"); // Green 600
      else baseFoliage = new THREE.Color("#15803d"); // Green 700

      // RESTORED: No color lerp to dead/black
      tempColor.copy(baseFoliage);

      for (let f = 0; f < FOLIAGE_PER_TREE; f++) {
        const yOffset = (2 + rng.next() * 1.5) * tree.scale;
        const xOffset = (rng.next() - 0.5) * 1.5 * tree.scale;
        const zOffset = (rng.next() - 0.5) * 1.5 * tree.scale;

        tempObject.position.set(
          tree.x + xOffset,
          tree.y + yOffset,
          tree.z + zOffset
        );

        // RESTORED: No shedding factor
        const fScale = tree.scale * (0.8 + rng.next() * 0.7);

        tempObject.scale.set(fScale, fScale, fScale);
        tempObject.rotation.set(rng.next() * Math.PI, rng.next() * Math.PI, rng.next() * Math.PI);

        tempObject.updateMatrix();
        foliageMesh.current!.setMatrixAt(foliageIndex, tempObject.matrix);
        foliageMesh.current!.setColorAt(foliageIndex, tempColor);
        foliageIndex++;
      }
    });

    trunkMesh.current.instanceMatrix.needsUpdate = true;
    if (trunkMesh.current.instanceColor) trunkMesh.current.instanceColor.needsUpdate = true;

    foliageMesh.current.instanceMatrix.needsUpdate = true;
    if (foliageMesh.current.instanceColor) foliageMesh.current.instanceColor.needsUpdate = true;

  }, [trees]); // Removed stress dependencies for visual stability


  return (
    <group>
      {/* TRUNKS */}
      <instancedMesh ref={trunkMesh} args={[undefined, undefined, trees.length]}>
        <cylinderGeometry args={[0.2, 0.4, 2, 8]} />
        <meshStandardMaterial color="#3e2723" roughness={0.95} metalness={0.0} envMapIntensity={0.2} />
      </instancedMesh>

      {/* FOLIAGE */}
      <instancedMesh ref={foliageMesh} args={[undefined, undefined, trees.length * FOLIAGE_PER_TREE]}>
        <coneGeometry args={[1.2, 2.5, 6]} />
        <meshStandardMaterial roughness={0.7} metalness={0.0} envMapIntensity={0.5} vertexColors={true} />
      </instancedMesh>
    </group>
  );
}