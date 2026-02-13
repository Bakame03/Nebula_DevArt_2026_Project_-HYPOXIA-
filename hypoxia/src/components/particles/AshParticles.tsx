"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import seededRandom from "@/utils/seededRandom";

export default function AshParticles() {
    const { permanentDamage } = useStore();
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const COUNT = 1000;

    // Initial positions
    const particles = useMemo(() => {
        seededRandom.reset(999);
        const data = [];
        for (let i = 0; i < COUNT; i++) {
            // Random position in a large volume around player
            const x = (seededRandom.next() - 0.5) * 100;
            const y = seededRandom.next() * 30;
            const z = (seededRandom.next() - 0.5) * 100;
            // Random speed factor
            const speed = 0.5 + seededRandom.next() * 1.5;
            data.push({ x, y, z, speed, initialY: y });
        }
        return data;
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Only render if there is some damage (Ash starts falling when world is hurt)
        // Scale opacity instead of hiding to keep loop simple
        const opacity = Math.min(permanentDamage * 2.5, 0.8);

        if (opacity <= 0.01) {
            meshRef.current.visible = false;
            return;
        }
        meshRef.current.visible = true;
        (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;

        // Animate falling
        particles.forEach((p, i) => {
            // Fall down
            p.y -= p.speed * delta * (1 + permanentDamage); // Falls faster with damage

            // Wind drift
            p.x -= delta * 0.5;

            // Reset if too low
            if (p.y < -5) {
                p.y = 30;
                p.x = (seededRandom.next() - 0.5) * 100; // Reset X to keep field full
            }

            dummy.position.set(p.x, p.y, p.z);
            // Tumble rotation
            dummy.rotation.set(
                state.clock.elapsedTime * p.speed,
                state.clock.elapsedTime * p.speed * 0.5,
                0
            );
            dummy.scale.set(0.1, 0.1, 0.1); // Tiny ash flakes
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial
                color="#888888"
                transparent
                opacity={0}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </instancedMesh>
    );
}
