"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { getTerrainHeight, riverCurve } from "@/utils/terrainLogic";
import seededRandom from "@/utils/seededRandom";

const tempObject = new THREE.Object3D();

export default function Animals() {
    const { stressLevel } = useStore();
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const ANIMAL_COUNT = 30;

    // ── Load Deer Sprite ──────────────────────────────────────────────
    const deerTexture = useTexture("/textures/deer_sprite.png");

    // ── Billboard PlaneGeometry (wider than tall for deer) ─────────────
    const deerPlane = useMemo(() => {
        // Deer proportions: wider than tall
        return new THREE.PlaneGeometry(3, 2.2);
    }, []);

    // ── Generate valid animal positions ────────────────────────────────
    const animals = useMemo(() => {
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

            if (minDist > 8) {
                const y = getTerrainHeight(x, z);
                const scale = 0.8 + rng.next() * 0.4;
                const phase = rng.next() * Math.PI * 2;
                validAnimals.push({ x, y, z, scale, phase });
            }
        }
        return validAnimals;
    }, []);

    // ── Every frame: billboard facing camera + animations ─────────────
    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.getElapsedTime();
        const camera = state.camera;

        // Disappearance based on stress
        const visibleRatio = Math.max(0, 1 - stressLevel);
        const visibleMaxIndex = Math.floor(animals.length * visibleRatio);

        animals.forEach((animal, i) => {
            if (i >= visibleMaxIndex) {
                // Hide by scaling to 0
                tempObject.scale.set(0, 0, 0);
            } else {
                // Breathing animation
                const breathe = Math.sin(time * 2 + animal.phase) * 0.02;

                // Position: offset Y by half height so base is on ground
                tempObject.position.set(
                    animal.x,
                    animal.y + (1.1 * animal.scale) + breathe,
                    animal.z
                );

                // Billboard: face camera (Y-axis only)
                const dx = camera.position.x - animal.x;
                const dz = camera.position.z - animal.z;
                const angle = Math.atan2(dx, dz);
                tempObject.rotation.set(0, angle, 0);

                // Scale
                tempObject.scale.set(animal.scale, animal.scale, animal.scale);
            }

            tempObject.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObject.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[deerPlane, undefined, animals.length]}>
            <meshStandardMaterial
                map={deerTexture}
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
