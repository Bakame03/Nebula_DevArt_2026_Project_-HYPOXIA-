"use client";
import { useStore } from "@/store/useStore";
import { useMemo, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { riverCurve, getTerrainHeight } from "@/utils/terrainLogic";

export default function Terrain() {
    const { stressLevel } = useStore();
    const meshRef = useRef<THREE.Mesh>(null);

    // Géométrie du terrain (Haute résolution pour les détails)
    const geometry = useMemo(() => {
        // Plane de 100x100 avec beaucoup de segments
        const geo = new THREE.PlaneGeometry(100, 100, 128, 128);
        geo.rotateX(-Math.PI / 2);

        const posAttribute = geo.attributes.position;
        const vertex = new THREE.Vector3();

        // Modification des vertex pour créer le lit de la rivière
        const colors = [];
        const color = new THREE.Color();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            const height = getTerrainHeight(vertex.x, vertex.z);
            posAttribute.setY(i, height);

            // Vertex Coloring Logic - Mystic River Palette
            if (height < -1.8) {
                // River Bed (Dark Rich Mud)
                color.set("#1c1917"); // Deep Brown-Black
            } else if (height < -0.1) {
                // Banks (Ochre/Clay) - Cracked Earth
                const t = (height + 1.8) / 1.7; // 0 to 1
                color.set("#b45309").lerp(new THREE.Color("#d97706"), t); // Dark to Light Ochre
            } else {
                // Forest Floor (Tender Greens)
                const baseGreen = Math.random() > 0.5 ? "#86efac" : "#4ade80"; // Soft greens
                color.set(baseGreen);
                // Subtle variation
                const noise = (Math.random() - 0.5) * 0.15;
                color.offsetHSL(0, noise * 0.2, noise);
            }
            colors.push(color.r, color.g, color.b);
        }

        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        return geo;
    }, []);

    // Material: Uses vertex colors
    return (
        <mesh ref={meshRef} geometry={geometry} receiveShadow>
            <meshStandardMaterial
                vertexColors
                roughness={0.9}
                metalness={0.1}
                flatShading={true}
            />
        </mesh>
    );
}
