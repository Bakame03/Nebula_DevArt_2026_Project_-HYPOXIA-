"use client";
import { useRef } from "react";
import * as THREE from "three";

export default function SceneLight() {
    return (
        <>
            {/* AMBIENT LIGHT (Moonlight scattering) */}
            <ambientLight intensity={0.2} color="#1e293b" />

            {/* DIRECTIONAL LIGHT (The Moon) */}
            <directionalLight
                position={[20, 30, 10]}
                intensity={0.8}
                color="#e2e8f0"
                castShadow
                shadow-mapSize={[1024, 1024]}
            >
                <orthographicCamera attach="shadow-camera" args={[-50, 50, 50, -50]} />
            </directionalLight>

            {/* A bit of rim light for drama */}
            <spotLight
                position={[-10, 10, -5]}
                intensity={0.5}
                color="#3b82f6"
                angle={0.5}
                penumbra={1}
            />
        </>
    );
}
