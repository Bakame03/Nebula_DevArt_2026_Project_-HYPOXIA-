"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight, riverCurve } from "@/utils/terrainLogic";
import seededRandom from "@/utils/seededRandom";


const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

// Procedurally generate a Low Poly Deer Geometry
const createDeerGeometry = () => {
    const geometries: THREE.BufferGeometry[] = [];

    // Helper to add a box part
    const addPart = (w: number, h: number, d: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        geo.rotateX(rx);
        geo.rotateY(ry);
        geo.rotateZ(rz);
        geo.translate(x, y, z);
        geometries.push(geo);
    };

    // Body
    addPart(0.6, 0.6, 1.2, 0, 1.3, 0);

    // Neck
    addPart(0.25, 0.8, 0.25, 0, 2.0, 0.5, -Math.PI / 8);

    // Head
    addPart(0.3, 0.35, 0.5, 0, 2.5, 0.8);

    // Legs (Front-Left, Front-Right, Back-Left, Back-Right)
    const legW = 0.12;
    const legH = 1.0;
    addPart(legW, legH, legW, -0.2, 0.5, 0.4);
    addPart(legW, legH, legW, 0.2, 0.5, 0.4);
    addPart(legW, legH, legW, -0.2, 0.5, -0.4);
    addPart(legW, legH, legW, 0.2, 0.5, -0.4);

    // Antlers (Simple branches)
    addPart(0.05, 0.4, 0.05, -0.1, 2.8, 0.7, 0, 0, 0.5);
    addPart(0.05, 0.4, 0.05, 0.1, 2.8, 0.7, 0, 0, -0.5);

    // Tail
    addPart(0.1, 0.2, 0.1, 0, 1.5, -0.6, 0.5);

    // Merge all parts
    if (geometries.length === 0) return new THREE.BoxGeometry(1, 1, 1);

    // Manual Merge Implementation to avoid 'three-stdlib' import issues
    const merged = new THREE.BufferGeometry();
    const pos: number[] = [];
    const norm: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    let vertexOffset = 0;

    geometries.forEach(geo => {
        // Ensure standard attributes exist
        if (!geo.attributes.position) return;

        const p = geo.attributes.position;
        const n = geo.attributes.normal;
        const u = geo.attributes.uv;
        const ind = geo.index;

        for (let i = 0; i < p.count; i++) {
            pos.push(p.getX(i), p.getY(i), p.getZ(i));
            if (n) norm.push(n.getX(i), n.getY(i), n.getZ(i));
            if (u) uvs.push(u.getX(i), u.getY(i));
        }

        if (ind) {
            for (let i = 0; i < ind.count; i++) {
                indices.push(ind.getX(i) + vertexOffset);
            }
        }
        vertexOffset += p.count;
    });

    merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if (norm.length > 0) merged.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
    if (uvs.length > 0) merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    if (indices.length > 0) merged.setIndex(indices);

    merged.computeVertexNormals(); // Ensure normals are computed for lighting
    return merged;
};

export default function Animals() {
    const { stressLevel } = useStore();
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const ANIMAL_COUNT = 30; // Fewer animals since they are more complex

    // Create geometry once
    const deerGeometry = useMemo(() => createDeerGeometry(), []);

    // Generate valid animal positions
    const animals = useMemo(() => {
        // Local generator
        const rng = new seededRandom(998877);

        const validAnimals = [];
        let attempts = 0;

        while (validAnimals.length < ANIMAL_COUNT && attempts < ANIMAL_COUNT * 20) {
            attempts++;
            const x = (rng.next() - 0.5) * 90;
            const z = (rng.next() - 0.5) * 90;

            let minDist = 1000;
            for (let j = 0; j <= 20; j++) {
                const point = riverCurve.getPoint(j / 20);
                const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
                if (dist < minDist) minDist = dist;
            }

            // Avoid river (keep them on land)
            if (minDist > 8) { // Keep them further from water edge
                const y = getTerrainHeight(x, z);
                const scale = 0.8 + rng.next() * 0.4;
                const rotationY = rng.next() * Math.PI * 2;
                // Random phase for idle animation
                const phase = rng.next() * Math.PI * 2;
                validAnimals.push({ x, y, z, scale, rotationY, phase });
            }
        }
        return validAnimals;
    }, []);

    // React to stress updates efficiently
    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.getElapsedTime();
        const animalCount = animals.length;

        // Disappearance Logic:
        // Calculate how many should be visible
        // Synchronized: 1.0 means fully visible at 0 stress, 0 at 1 stress
        const visibleRatio = Math.max(0, 1 - stressLevel);
        const visibleMaxIndex = Math.floor(animalCount * visibleRatio);

        // Update Colors
        const baseColor = new THREE.Color("#8d6e63");
        // Darken slightly with stress
        const sickColor = new THREE.Color("#4e342e");
        const currentColor = baseColor.clone().lerp(sickColor, stressLevel * 0.5);

        for (let i = 0; i < animalCount; i++) {
            const animal = animals[i];

            // Visibility Check
            if (i >= visibleMaxIndex) {
                // Hide by scaling to 0
                tempObject.scale.set(0, 0, 0);
            } else {
                // Animate Visible Animals
                const breathe = Math.sin(time * 2 + animal.phase) * 0.02;
                tempObject.position.set(animal.x, animal.y + breathe, animal.z);
                tempObject.scale.set(animal.scale, animal.scale, animal.scale);
                tempObject.rotation.set(0, animal.rotationY, 0);

                // Grazing/Idle tilt
                const tilt = Math.sin(time * 0.5 + animal.phase) * 0.05;
                tempObject.rotation.x = tilt;

                // Update Color
                meshRef.current.setColorAt(i, currentColor);
            }

            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, animals.length]}>
            {/* Use our Generated Geometry */}
            <primitive object={deerGeometry} attach="geometry" />
            <meshStandardMaterial
                roughness={0.8}
                metalness={0.0}
                envMapIntensity={0.5}
            />
        </instancedMesh>
    );
}
