"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import seededRandom from "@/utils/seededRandom";

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

// Manual Low Poly Bird Geometry
function createManualBirdGeo() {
    const geom = new THREE.BufferGeometry();

    // Simple V-Shape with body
    // Vertices [x, y, z]
    const vertices = new Float32Array([
        // Body (Pyramid)
        0, 0, 0.4,   // Nose 0
        0.1, -0.1, -0.2, // Back R 1
        -0.1, -0.1, -0.2, // Back L 2
        0, 0.1, -0.2, // Back Top 3

        // Left Wing
        -0.1, 0, 0.1, // Body Attach 4
        -0.8, 0.2, -0.2, // Tip 5
        -0.1, 0, -0.2, // Back Attach 6

        // Right Wing
        0.1, 0, 0.1, // Body Attach 7
        0.8, 0.2, -0.2, // Tip 8
        0.1, 0, -0.2, // Back Attach 9
    ]);

    const indices = [
        0, 1, 3, // Body Right
        0, 3, 2, // Body Left
        0, 2, 1, // Body Bottom
        1, 2, 3, // Body Back

        4, 5, 6, // Left Wing
        6, 5, 4, // Left Wing double side

        7, 8, 9, // Right Wing
        9, 8, 7  // Right Wing double side
    ];

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
}

export default function Birds() {
    const { stressLevel } = useStore();
    const skyBirdsMesh = useRef<THREE.InstancedMesh>(null);

    const SKY_BIRD_COUNT = 50;

    // Geometry
    const birdGeometry = useMemo(() => createManualBirdGeo(), []);

    // ── Load Normal Map Texture ─────────────────────────────────────
    const birdNormal = useTexture("/textures/bark_normal.jpg");

    useMemo(() => {
        birdNormal.wrapS = THREE.RepeatWrapping;
        birdNormal.wrapT = THREE.RepeatWrapping;
        birdNormal.repeat.set(1, 1);
    }, [birdNormal]);

    // --- Sky Birds Logic (Flock) ---
    const skyBirdsData = useMemo(() => {
        // Local generator
        const rng = new seededRandom(112233);
        const data = [];
        for (let i = 0; i < SKY_BIRD_COUNT; i++) {
            const x = (rng.next() - 0.5) * 140;
            const z = (rng.next() - 0.5) * 140;
            // Lower altitude for visibility: 8m - 20m
            const y = 8 + rng.next() * 12;
            const speed = 0.5 + rng.next() * 0.5;
            const offset = rng.next() * Math.PI * 2;
            data.push({ x, y, z, speed, offset, startY: y });
        }
        return data;
    }, []);

    useFrame((state) => {
        if (!skyBirdsMesh.current) return;

        const time = state.clock.getElapsedTime();
        // Base uniform scale for all birds (shrinks them slightly with stress)
        // const birdScale = Math.max(0, 1 - stressLevel * 1.5); 
        // Better: Keep size constant, just hide them count-wise
        const birdScale = 1.0;

        // Disappear one by one based on Stress Level
        const visibleCount = Math.floor(SKY_BIRD_COUNT * (1 - stressLevel));

        skyBirdsData.forEach((bird, i) => {
            const radius = 40 + Math.sin(time * 0.2 + bird.offset) * 10;
            const angle = time * bird.speed * 0.2 + bird.offset;

            const curX = Math.cos(angle) * radius;
            const curZ = Math.sin(angle) * radius;
            const curY = bird.startY + Math.sin(time + bird.offset) * 2;

            tempObject.position.set(curX, curY, curZ);

            const targetX = Math.cos(angle + 0.1) * radius;
            const targetZ = Math.sin(angle + 0.1) * radius;
            tempObject.lookAt(targetX, curY, targetZ);

            tempObject.rotateZ(-0.5); // Bank left

            // Visibility Logic
            if (i >= visibleCount) {
                tempObject.scale.set(0, 0, 0);
            } else {
                tempObject.scale.set(birdScale, birdScale, birdScale);
            }

            tempObject.updateMatrix();
            skyBirdsMesh.current!.setMatrixAt(i, tempObject.matrix);
        });

        skyBirdsMesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            {/* SKY BIRDS - Dark Grey with Normal Map */}
            <instancedMesh ref={skyBirdsMesh} args={[undefined, undefined, SKY_BIRD_COUNT]} geometry={birdGeometry}>
                <meshStandardMaterial
                    color="#333"
                    normalMap={birdNormal}
                    normalScale={new THREE.Vector2(0.4, 0.4)}
                    roughness={0.6}
                    side={THREE.DoubleSide}
                />
            </instancedMesh>
        </group>
    );
}
