"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import { getTerrainHeight, riverCurve } from "@/utils/terrainLogic";

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
    const validTrees = [];
    let attempts = 0;

    while (validTrees.length < TREE_COUNT && attempts < TREE_COUNT * 20) {
      attempts++;
      const x = (Math.random() - 0.5) * 90;
      const z = (Math.random() - 0.5) * 90;

      let minDist = 1000;
      for (let j = 0; j <= 20; j++) {
        const point = riverCurve.getPoint(j / 20);
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
        if (dist < minDist) minDist = dist;
      }

      if (minDist > 6) {
        const scale = 0.8 + Math.random() * 1.2;
        const y = getTerrainHeight(x, z);
        const type = Math.random();
        validTrees.push({ x, y, z, scale, type });
      }
    }
    console.log("Forest: Generated trees:", validTrees.length);
    return validTrees;
  }, []);

  useLayoutEffect(() => {
    if (!trunkMesh.current || !foliageMesh.current) return;

    let foliageIndex = 0;

    trees.forEach((tree, i) => {
      // 1. TRUNK
      tempObject.position.set(tree.x, tree.y + (1 * tree.scale), tree.z);
      tempObject.scale.set(tree.scale, tree.scale, tree.scale);
      tempObject.rotation.set(0, Math.random() * Math.PI, 0);
      tempObject.updateMatrix();
      trunkMesh.current!.setMatrixAt(i, tempObject.matrix);

      // Init trunk color
      trunkMesh.current!.setColorAt(i, new THREE.Color("#3e2723"));

      // 2. FOLIAGE
      for (let f = 0; f < FOLIAGE_PER_TREE; f++) {
        const yOffset = (2 + Math.random() * 1.5) * tree.scale;
        const xOffset = (Math.random() - 0.5) * 1.5 * tree.scale;
        const zOffset = (Math.random() - 0.5) * 1.5 * tree.scale;

        tempObject.position.set(
          tree.x + xOffset,
          tree.y + yOffset,
          tree.z + zOffset
        );

        const fScale = tree.scale * (0.8 + Math.random() * 0.7);
        tempObject.scale.set(fScale, fScale, fScale);
        tempObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        tempObject.updateMatrix();
        foliageMesh.current!.setMatrixAt(foliageIndex, tempObject.matrix);
        foliageIndex++;
      }
    });

    trunkMesh.current.instanceMatrix.needsUpdate = true;
    if (trunkMesh.current.instanceColor) trunkMesh.current.instanceColor.needsUpdate = true;

    foliageMesh.current.instanceMatrix.needsUpdate = true;
  }, [trees]);

  // Update Colors based on Stress
  useLayoutEffect(() => {
    if (!foliageMesh.current) return;

    const burnLevel = Math.min(stressLevel + permanentDamage, 1);

    let foliageIndex = 0;
    trees.forEach((tree) => {
      // Base Color Calculation (MYSTIC RIVER - VIBRANT LUSH GREENS)
      let baseColor;
      // Tender, vibrant green variations
      if (tree.type < 0.3) baseColor = new THREE.Color("#22c55e"); // Bright Green
      else if (tree.type < 0.6) baseColor = new THREE.Color("#16a34a"); // Medium Green
      else baseColor = new THREE.Color("#15803d"); // Deep Green

      // Apply Burn (Blackening)
      // Dev 2 Requirement: Green -> Black (Burnt)
      tempColor.copy(baseColor).lerp(new THREE.Color("#000000"), burnLevel);

      for (let f = 0; f < FOLIAGE_PER_TREE; f++) {
        foliageMesh.current!.setColorAt(foliageIndex, tempColor);
        foliageIndex++;
      }
    });

    if (foliageMesh.current.instanceColor) foliageMesh.current.instanceColor.needsUpdate = true;

  }, [trees, stressLevel, permanentDamage]);


  return (
    <group>
      {/* TRUNKS */}
      <instancedMesh ref={trunkMesh} args={[undefined, undefined, trees.length]}>
        <cylinderGeometry args={[0.2, 0.4, 2, 5]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </instancedMesh>

      {/* FOLIAGE (Cones for Low Poly Look) */}
      <instancedMesh ref={foliageMesh} args={[undefined, undefined, trees.length * FOLIAGE_PER_TREE]}>
        <coneGeometry args={[1.2, 2.5, 4]} />
        <meshStandardMaterial roughness={0.6} vertexColors={false} />
      </instancedMesh>
    </group>
  );
}