"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { getTerrainHeight } from "@/utils/terrainLogic";
import seededRandom from "@/utils/seededRandom";
import { useStore } from "@/store/useStore";

// Terrain color waypoints for material tint (multiplies with vertex colors)
const COLOR_ALIVE = new THREE.Color("#ffffff");   // grass texture shows naturally
const COLOR_DRY   = new THREE.Color("#c8a870");   // parched yellow
const COLOR_DEAD  = new THREE.Color("#5c4a38");   // cracked grey-brown earth

export default function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const grassTexture = useTexture("/textures/grass_texture.png");

  useMemo(() => {
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(20, 20);
  }, [grassTexture]);

  const geometry = useMemo(() => {
    const rng = new seededRandom(12345);
    const geo = new THREE.PlaneGeometry(100, 100, 256, 256);
    geo.rotateX(-Math.PI / 2);

    const posAttribute = geo.attributes.position;
    const vertex = new THREE.Vector3();
    const colors: number[] = [];
    const color = new THREE.Color();

    for (let i = 0; i < posAttribute.count; i++) {
      vertex.fromBufferAttribute(posAttribute, i);
      const height = getTerrainHeight(vertex.x, vertex.z);
      posAttribute.setY(i, height);

      if (height < -1.8) {
        color.set("#1c1917");
      } else if (height < -0.1) {
        const t = (height + 1.8) / 1.7;
        color.set("#b45309").lerp(new THREE.Color("#d97706"), t);
      } else {
        color.set("#ffffff");
        const noise = (rng.next() - 0.5) * 0.1;
        color.offsetHSL(0, 0, noise);
      }
      colors.push(color.r, color.g, color.b);
    }

    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Imperatively update material color each frame — no React re-render needed.
  useFrame(() => {
    if (!materialRef.current) return;
    const s = useStore.getState().stressLevel;

    if (s < 0.4) {
      materialRef.current.color.lerpColors(COLOR_ALIVE, COLOR_DRY, s / 0.4);
    } else {
      materialRef.current.color.lerpColors(COLOR_DRY, COLOR_DEAD, (s - 0.4) / 0.6);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        ref={materialRef}
        map={grassTexture}
        vertexColors
        roughness={0.9}
        metalness={0.05}
        flatShading={false}
        envMapIntensity={0.3}
      />
    </mesh>
  );
}
