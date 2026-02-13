"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { getTerrainHeight, riverCurve } from "@/utils/terrainLogic";
import seededRandom from "@/utils/seededRandom";

const tempObject = new THREE.Object3D();

export default function Forest() {
  const { stressLevel } = useStore();
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const TREE_COUNT = 200;

  // ── Load Tree Sprite Texture ────────────────────────────────────────
  const treeTexture = useTexture("/textures/tree_sprite.png");

  // ── Billboard PlaneGeometry (tall rectangle for tree) ───────────────
  const planeGeo = useMemo(() => {
    // Width 5, Height 8 → tall tree proportions
    return new THREE.PlaneGeometry(5, 8);
  }, []);

  // ── Generate valid tree positions ───────────────────────────────────
  const trees = useMemo(() => {
    const rng = new seededRandom(67890);
    const validTrees = [];
    let attempts = 0;

    while (validTrees.length < TREE_COUNT && attempts < TREE_COUNT * 20) {
      attempts++;
      const x = (rng.next() - 0.5) * 90;
      const z = (rng.next() - 0.5) * 90;

      // Avoid the river
      let minDist = 1000;
      for (let j = 0; j <= 20; j++) {
        const point = riverCurve.getPoint(j / 20);
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
        if (dist < minDist) minDist = dist;
      }

      if (minDist > 6) {
        const scale = 0.6 + rng.next() * 1.0; // Random scale variation
        const y = getTerrainHeight(x, z);
        validTrees.push({ x, y, z, scale });
      }
    }
    return validTrees;
  }, []);

  // ── Set initial positions (once) ────────────────────────────────────
  useMemo(() => {
    // We need to defer this to after mount, but we can prepare the data
  }, [trees]);

  // ── Every frame: make billboards face the camera ────────────────────
  useFrame((state) => {
    if (!meshRef.current) return;

    const camera = state.camera;

    trees.forEach((tree, i) => {
      // Position the tree, offset Y by half its height so the base is on the ground
      tempObject.position.set(tree.x, tree.y + (4 * tree.scale), tree.z);

      // Billboard: make the plane always face the camera
      // We only rotate around Y axis (vertical billboard) so they don't tilt
      const dx = camera.position.x - tree.x;
      const dz = camera.position.z - tree.z;
      const angle = Math.atan2(dx, dz);
      tempObject.rotation.set(0, angle, 0);

      // Scale
      tempObject.scale.set(tree.scale, tree.scale, tree.scale);

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[planeGeo, undefined, trees.length]}>
      <meshStandardMaterial
        map={treeTexture}
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