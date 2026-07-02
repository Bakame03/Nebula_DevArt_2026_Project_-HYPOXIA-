"use client";
import { useStore } from "@/store/useStore";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { riverCurve, getTerrainHeight } from "@/utils/terrainLogic";
import seededRandom from "@/utils/seededRandom";

export default function Terrain() {
    const { stressLevel } = useStore();
    const meshRef = useRef<THREE.Mesh>(null);

    // ── Load Grass Texture ────────────────────────────────────────────
    const grassTexture = useTexture("/textures/grass_texture.png");

    useMemo(() => {
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(20, 20); // Tile across the terrain
    }, [grassTexture]);

    // Géométrie du terrain (Haute résolution pour les détails)
    const geometry = useMemo(() => {
        const rng = new seededRandom(12345);

        const geo = new THREE.PlaneGeometry(100, 100, 256, 256);
        geo.rotateX(-Math.PI / 2);

        const posAttribute = geo.attributes.position;
        const vertex = new THREE.Vector3();

        // Vertex coloring for riverbed vs banks vs forest floor
        const colors = [];
        const color = new THREE.Color();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            const height = getTerrainHeight(vertex.x, vertex.z);
            posAttribute.setY(i, height);

            // Vertex Coloring Logic - Mystic River Palette
            if (height < -1.8) {
                // River Bed (Dark Rich Mud)
                color.set("#1c1917");
            } else if (height < -0.1) {
                // Banks (Ochre/Clay)
                const t = (height + 1.8) / 1.7;
                color.set("#b45309").lerp(new THREE.Color("#d97706"), t);
            } else {
                // Forest Floor — white tint so grass texture shows naturally
                color.set("#ffffff");
                // Subtle variation
                const noise = (rng.next() - 0.5) * 0.1;
                color.offsetHSL(0, 0, noise);
            }
            colors.push(color.r, color.g, color.b);
        }

        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        return geo;
    }, []);

    return (
        <mesh ref={meshRef} geometry={geometry} receiveShadow>
            <meshStandardMaterial
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
