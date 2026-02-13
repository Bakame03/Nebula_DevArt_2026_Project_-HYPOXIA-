"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { getTerrainHeight, riverCurve } from "@/utils/terrainLogic";
import seededRandom from "@/utils/seededRandom";

const tempObject = new THREE.Object3D();

export default function Decorations() {
    const { stressLevel, permanentDamage } = useStore();
    const rockMesh = useRef<THREE.InstancedMesh>(null);
    const grassMesh = useRef<THREE.InstancedMesh>(null);

    const ROCK_COUNT = 300;
    const GRASS_COUNT = 5000;

    // ── Load Grass Blade Sprite ───────────────────────────────────────
    const grassSprite = useTexture("/textures/grass_blade.png");

    // ── Load Bark Normal Map for rocks ────────────────────────────────
    const rockNormal = useTexture("/textures/bark_normal.jpg");

    useMemo(() => {
        rockNormal.wrapS = THREE.RepeatWrapping;
        rockNormal.wrapT = THREE.RepeatWrapping;
        rockNormal.repeat.set(1, 1);
    }, [rockNormal]);

    // Billboard PlaneGeometry for grass blades
    const grassPlane = useMemo(() => {
        return new THREE.PlaneGeometry(0.6, 1.2);
    }, []);

    const { rocks, ferns } = useMemo(() => {
        const rng = new seededRandom(24680);
        const _rocks = [];
        const _ferns = [];

        // Rocks: IN the river bed + along banks
        for (let i = 0; i < ROCK_COUNT; i++) {
            const x = (rng.next() - 0.5) * 90;
            const z = (rng.next() - 0.5) * 90;

            let minDist = 1000;
            for (let j = 0; j <= 20; j++) {
                const point = riverCurve.getPoint(j / 20);
                const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
                if (dist < minDist) minDist = dist;
            }

            if (minDist > 0.5 && minDist < 9) {
                const y = getTerrainHeight(x, z);
                const scale = minDist < 3 ? 0.3 + rng.next() * 0.5 : 0.2 + rng.next() * 0.6;
                _rocks.push({ x, y, z, scale });
            }
        }

        // Grass blades: Dense vegetation
        for (let i = 0; i < GRASS_COUNT; i++) {
            const x = (rng.next() - 0.5) * 95;
            const z = (rng.next() - 0.5) * 95;

            let minDist = 1000;
            for (let j = 0; j <= 10; j++) {
                const point = riverCurve.getPoint(j / 10);
                const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
                if (dist < minDist) minDist = dist;
            }

            if (minDist > 3.5) {
                const y = getTerrainHeight(x, z);
                const scale = 0.5 + rng.next() * 0.8;
                const rotY = rng.next() * Math.PI; // Random Y rotation
                _ferns.push({ x, y, z, scale, rotY });
            }
        }

        return { rocks: _rocks, ferns: _ferns };
    }, []);

    useLayoutEffect(() => {
        if (rockMesh.current) {
            const rng = new seededRandom(11223);
            rocks.forEach((rock, i) => {
                tempObject.position.set(rock.x, rock.y + (0.3 * rock.scale), rock.z);
                tempObject.scale.set(rock.scale, rock.scale, rock.scale);
                tempObject.rotation.set(rng.next() * Math.PI, rng.next() * Math.PI, rng.next() * Math.PI);
                tempObject.updateMatrix();
                rockMesh.current!.setMatrixAt(i, tempObject.matrix);
            });
            rockMesh.current.instanceMatrix.needsUpdate = true;
        }

        if (grassMesh.current) {
            ferns.forEach((fern, i) => {
                // Position at ground level, offset up by half the plane height
                tempObject.position.set(fern.x, fern.y + (0.6 * fern.scale), fern.z);
                tempObject.scale.set(fern.scale, fern.scale * 1.5, fern.scale);
                tempObject.rotation.set(0, fern.rotY, 0);
                tempObject.updateMatrix();
                grassMesh.current!.setMatrixAt(i, tempObject.matrix);
            });
            grassMesh.current.instanceMatrix.needsUpdate = true;
        }
    }, [rocks, ferns]);

    // Fern Color: Vibrant Green -> Dead Brown based on stress
    const fernColor = new THREE.Color("#16a34a").lerp(
        new THREE.Color("#4b3621"),
        Math.min(stressLevel + permanentDamage, 1)
    );

    return (
        <group>
            {/* ROCKS (Grey River Stones) with Normal Map */}
            <instancedMesh ref={rockMesh} args={[undefined, undefined, rocks.length]}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                    color="#6b7280"
                    normalMap={rockNormal}
                    normalScale={new THREE.Vector2(0.7, 0.7)}
                    roughness={0.85}
                    metalness={0.15}
                    envMapIntensity={0.4}
                />
            </instancedMesh>

            {/* GRASS BLADES (Billboard sprites) */}
            <instancedMesh ref={grassMesh} args={[grassPlane, undefined, ferns.length]}>
                <meshStandardMaterial
                    map={grassSprite}
                    color={fernColor}
                    alphaTest={0.5}
                    transparent
                    side={THREE.DoubleSide}
                    roughness={0.8}
                    metalness={0.0}
                    depthWrite={true}
                />
            </instancedMesh>
        </group>
    );
}
