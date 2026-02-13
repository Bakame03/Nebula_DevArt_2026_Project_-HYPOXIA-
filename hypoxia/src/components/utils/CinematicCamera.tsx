import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";

interface CinematicCameraProps {
    active: boolean;
}

export default function CinematicCamera({ active }: CinematicCameraProps) {
    const theta = useRef(0);
    const targetPos = new THREE.Vector3();

    useFrame((state, delta) => {
        if (!active) return;

        // Increment angle smoothly
        // Speed: 0.1 radians/sec
        theta.current += delta * 0.1;

        // Calculate orbital position
        const radius = 35; // Wider orbit to see everything
        const height = 12 + Math.sin(state.clock.elapsedTime * 0.2) * 2; // Subtle vertical bob

        const x = Math.sin(theta.current) * radius;
        const z = Math.cos(theta.current) * radius;

        targetPos.set(x, height, z);

        // Smoothly interpolate camera position towards target
        // We use a stronger lerp factor since this IS the camera controller when active
        state.camera.position.lerp(targetPos, 0.05);

        // Always look at center (slightly elevated to see river/forest better)
        state.camera.lookAt(0, 2, 0);

        // Update projection matrix
        state.camera.updateProjectionMatrix();

        // Ensure near/far planes are reasonable
        if (state.camera instanceof THREE.PerspectiveCamera) {
            state.camera.near = 0.1;
            state.camera.far = 200;
            // Optionally adjust FOV for cinematic feel?
            // state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, 50, 0.05);
        }
    });

    return null;
}
