"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import seededRandom from "@/utils/seededRandom";

const tempObject = new THREE.Object3D();

export default function Birds() {
    const { stressLevel } = useStore();
    const skyBirdsMesh = useRef<THREE.InstancedMesh>(null);

    const SKY_BIRD_COUNT = 50;

    // ── Load Bird Sprite ──────────────────────────────────────────────
    const birdTexture = useTexture("/textures/bird_sprite.png");

    // ── Billboard PlaneGeometry (wider for wingspan) ──────────────────
    const birdPlane = useMemo(() => {
        return new THREE.PlaneGeometry(1.5, 1.2);
    }, []);

    // ── Sky Birds Data ────────────────────────────────────────────────
    const skyBirdsData = useMemo(() => {
        const rng = new seededRandom(112233);
        const data = [];
        for (let i = 0; i < SKY_BIRD_COUNT; i++) {
            const x = (rng.next() - 0.5) * 140;
            const z = (rng.next() - 0.5) * 140;
            const y = 8 + rng.next() * 12;
            const speed = 0.5 + rng.next() * 0.5;
            const offset = rng.next() * Math.PI * 2;
            data.push({ x, y, z, speed, offset, startY: y });
        }
        return data;
    }, []);

    // ── Animation: circular flight + billboard ────────────────────────
    useFrame((state) => {
        if (!skyBirdsMesh.current) return;

        const time = state.clock.getElapsedTime();
        const camera = state.camera;

        // Disappear one by one based on stress
        const visibleCount = Math.floor(SKY_BIRD_COUNT * (1 - stressLevel));

        skyBirdsData.forEach((bird, i) => {
            const radius = 40 + Math.sin(time * 0.2 + bird.offset) * 10;
            const angle = time * bird.speed * 0.2 + bird.offset;

            const curX = Math.cos(angle) * radius;
            const curZ = Math.sin(angle) * radius;
            const curY = bird.startY + Math.sin(time + bird.offset) * 2;

            tempObject.position.set(curX, curY, curZ);

            // Billboard: face camera (Y-axis only)
            const dx = camera.position.x - curX;
            const dz = camera.position.z - curZ;
            const billboardAngle = Math.atan2(dx, dz);
            tempObject.rotation.set(0, billboardAngle, 0);

            // Visibility
            if (i >= visibleCount) {
                tempObject.scale.set(0, 0, 0);
            } else {
                tempObject.scale.set(1, 1, 1);
            }

            tempObject.updateMatrix();
            skyBirdsMesh.current!.setMatrixAt(i, tempObject.matrix);
        });

        skyBirdsMesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={skyBirdsMesh} args={[birdPlane, undefined, SKY_BIRD_COUNT]}>
            <meshStandardMaterial
                map={birdTexture}
                alphaTest={0.5}
                transparent
                side={THREE.DoubleSide}
                roughness={0.6}
                depthWrite={true}
            />
        </instancedMesh>
    );
}
