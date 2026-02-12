"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import { getTerrainHeight, riverCurve } from "@/utils/terrainLogic";
import seededRandom from "@/utils/seededRandom";

const tempObject = new THREE.Object3D();

export default function Decorations() {
    const { stressLevel, permanentDamage } = useStore();
    const rockMesh = useRef<THREE.InstancedMesh>(null);
    const grassMesh = useRef<THREE.InstancedMesh>(null);

    const ROCK_COUNT = 300; // Dense rocks for river obstacles
    const GRASS_COUNT = 5000; // Lush vegetation

    const { rocks, ferns } = useMemo(() => {
        // Reset seed
        seededRandom.reset(24680);

        const _rocks = [];
        const _ferns = [];

        // Rocks: IN the river bed + along banks
        for (let i = 0; i < ROCK_COUNT; i++) {
            const x = (seededRandom.next() - 0.5) * 90;
            const z = (seededRandom.next() - 0.5) * 90;

            let minDist = 1000;
            for (let j = 0; j <= 20; j++) {
                const point = riverCurve.getPoint(j / 20);
                const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
                if (dist < minDist) minDist = dist;
            }

            // River Bed (0.5-3) + Banks (3-9)
            if (minDist > 0.5 && minDist < 9) {
                const y = getTerrainHeight(x, z);
                const scale = minDist < 3 ? 0.3 + seededRandom.next() * 0.5 : 0.2 + seededRandom.next() * 0.6;
                _rocks.push({ x, y, z, scale });
            }
        }

        // Ferns/Grass: Dense, especially on banks
        for (let i = 0; i < GRASS_COUNT; i++) {
            const x = (seededRandom.next() - 0.5) * 95;
            const z = (seededRandom.next() - 0.5) * 95;

            let minDist = 1000;
            for (let j = 0; j <= 10; j++) {
                const point = riverCurve.getPoint(j / 10);
                const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
                if (dist < minDist) minDist = dist;
            }

            // Grass everywhere implies lush season
            if (minDist > 3.5) { // Not inside water (starting from bank edge)
                const y = getTerrainHeight(x, z);
                const scale = 0.5 + seededRandom.next() * 0.8; // Larger for ferns
                _ferns.push({ x, y, z, scale });
            }
        }

        return { rocks: _rocks, ferns: _ferns };
    }, []);

    useLayoutEffect(() => {
        if (rockMesh.current) {
            // Reset seed for consistency (although not strictly needed if inputs are static)
            seededRandom.reset(11223);

            rocks.forEach((rock, i) => {
                tempObject.position.set(rock.x, rock.y + (0.3 * rock.scale), rock.z);
                tempObject.scale.set(rock.scale, rock.scale, rock.scale);
                tempObject.rotation.set(seededRandom.next() * Math.PI, seededRandom.next() * Math.PI, seededRandom.next() * Math.PI);
                tempObject.updateMatrix();
                rockMesh.current!.setMatrixAt(i, tempObject.matrix);
            });
            rockMesh.current.instanceMatrix.needsUpdate = true;
        }

        if (grassMesh.current) {
            seededRandom.reset(33445);

            ferns.forEach((fern, i) => {
                tempObject.position.set(fern.x, fern.y, fern.z);
                tempObject.scale.set(fern.scale, fern.scale * 1.5, fern.scale); // Tall ferns
                tempObject.rotation.set(0, seededRandom.next() * Math.PI, 0);
                tempObject.updateMatrix();
                grassMesh.current!.setMatrixAt(i, tempObject.matrix);
            });
            grassMesh.current.instanceMatrix.needsUpdate = true;
        }
    }, [rocks, ferns]);

    // Fern Color: Vibrant Green -> Dead Brown
    const fernColor = new THREE.Color("#16a34a").lerp(new THREE.Color("#4b3621"), Math.min(stressLevel + permanentDamage, 1));

    return (
        <group>
            {/* ROCKS (Grey River Stones) - Photorealistic */}
            <instancedMesh ref={rockMesh} args={[undefined, undefined, rocks.length]}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                    color="#6b7280"
                    roughness={0.85}
                    metalness={0.15}
                    envMapIntensity={0.4}
                />
            </instancedMesh>

            {/* FERNS (using Cone for stylized look) */}
            <instancedMesh ref={grassMesh} args={[undefined, undefined, ferns.length]}>
                <coneGeometry args={[0.3, 1, 4]} />
                <meshStandardMaterial color={fernColor} side={THREE.DoubleSide} />
            </instancedMesh>
        </group>
    );
}
