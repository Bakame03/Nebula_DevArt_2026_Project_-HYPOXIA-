"use client";
import React, { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";
import { riverCurve } from "@/utils/terrainLogic";
import { shaderMaterial } from "@react-three/drei";
import { useStore } from "@/store/useStore";

// --- HYPER REALISTIC WATER SHADER ---
const HyperWaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uStress: 0,
    // Colors PBR-ish
    uDeepColor: new THREE.Color("#0f172a"), // Slate 900 (Deep/Dark)
    uSurfaceColor: new THREE.Color("#0ea5e9"), // Sky 500 (Surface)
    uFoamColor: new THREE.Color("#f8fafc"), // Slate 50 (White foam)
    uSunDirection: new THREE.Vector3(10, 20, 10).normalize(),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vViewPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    uniform float uTime;
    uniform float uStress;

    // Gerstner Wave or Sine approximation for physical displacement
    void main() {
      vUv = uv;
      vec3 pos = position;

      // Physical Waves
      float freq = 2.0;
      float amp = 0.1 + (uStress * 0.2); // Stress increases wave height
      float speed = 1.0 + uStress;

      // Complex wave composition
      float wave1 = sin(pos.z * freq + uTime * speed) * amp;
      float wave2 = cos(pos.x * freq * 0.5 + uTime * speed * 0.8) * amp * 0.5;
      
      // Displacement
      // Flattened tube means Y is up-ish in local space, but depends on rotation.
      // We displace along normal to be safe.
      vec3 displaced = pos + normal * (wave1 + wave2);

      vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
      vWorldPosition = worldPos.xyz;
      
      vec4 mvPosition = viewMatrix * worldPos;
      gl_Position = projectionMatrix * mvPosition;

      vViewPosition = -mvPosition.xyz;
      vNormal = normalMatrix * normal;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform float uStress;
    uniform vec3 uDeepColor;
    uniform vec3 uSurfaceColor;
    uniform vec3 uFoamColor;
    uniform vec3 uSunDirection;

    varying vec2 vUv;
    varying vec3 vViewPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    // FBM Noise for surface detail
    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    float noise(vec2 x) {
        vec2 p = floor(x);
        vec2 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        float n = p.x + p.y * 57.0;
        return mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                   mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
    }
    float fbm(vec2 p) {
        float f = 0.0;
        f += 0.50000 * noise(p); p *= 2.02;
        f += 0.25000 * noise(p); p *= 2.03;
        f += 0.12500 * noise(p); p *= 2.01; 
        f += 0.06250 * noise(p);
        return f;
    }

    void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        // 1. Flowing UVs
        vec2 flowUV = vUv * vec2(10.0, 1.0); // Tiling width
        float flowSpeed = 0.2 + (uStress * 0.5);
        flowUV.x -= uTime * flowSpeed;

        // 2. Normal Map Simulation (Perturb normal with noise)
        float surfaceNoise = fbm(flowUV * 4.0);
        vec3 perturbedNormal = normalize(normal + vec3(surfaceNoise * 0.2, surfaceNoise * 0.2, 0.0));

        // 3. Fresnel reflection (Schlick approximation)
        float NdotV = max(0.0, dot(perturbedNormal, viewDir));
        float fresnel = pow(1.0 - NdotV, 5.0);

        // 4. Color Mixing based on Depth/Normal
        // Looking straight down (NdotV ~ 1.0) -> See Deep Color
        // Glancing angle (NdotV ~ 0.0) -> See Surface/Reflect
        vec3 waterColor = mix(uDeepColor, uSurfaceColor, fresnel + (surfaceNoise * 0.2));

        // 5. Specular Highlight (Sun)
        vec3 halfVector = normalize(uSunDirection + viewDir);
        float NdotH = max(0.0, dot(perturbedNormal, halfVector));
        float specular = pow(NdotH, 100.0); // Sharp shine
        
        // 6. Foam
        // Foam at edges (near Uv.y 0.0/1.0 if not flattened?) 
        // Or based on noise peaks
        float foamThreshold = 0.7 - (uStress * 0.1);
        float foamMask = smoothstep(foamThreshold, foamThreshold + 0.05, surfaceNoise);
        
        vec3 finalColor = mix(waterColor, uFoamColor, foamMask);
        finalColor += vec3(specular); // Add specular (additive)

        gl_FragColor = vec4(finalColor, 0.9);
    }
  `
);

extend({ HyperWaterMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      hyperWaterMaterial: any;
    }
  }
}

export default function River() {
  const { stressLevel } = useStore();
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    // High res tube for smooth waves
    return new THREE.TubeGeometry(riverCurve, 200, 5, 20, false);
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      materialRef.current.uStress = stressLevel;
    }

    if (meshRef.current) {
      // Flatten geometry to make it look like a river surface, not a pipe
      meshRef.current.scale.y = 0.1;
      meshRef.current.scale.x = 1.0;

      // Adjust water level based on stress (Drought effect)
      // Level -1.0 (High) to -3.0 (Low)
      meshRef.current.position.y = -1.5 - (stressLevel * 2.0);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[0, 0, 0]} receiveShadow castShadow>
      {/* @ts-ignore */}
      <hyperWaterMaterial ref={materialRef} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}
