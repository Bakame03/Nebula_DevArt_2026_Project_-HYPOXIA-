"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";
import { riverCurve } from "@/utils/terrainLogic";
import { shaderMaterial } from "@react-three/drei";

// Shader Material pour l'eau qui coule
const RiverWaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#60a5fa"),
    uStress: 0,
  },
  // Vertex Shader (TURBULENT WATERS UPGRADE)
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uStress;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Phase 2: Turbulent Waters
      // Waves act based on stress. calm = flat, stress = choppy.
      float waveX = sin(pos.x * 2.0 + uTime * 3.0);
      float waveZ = sin(pos.z * 1.5 + uTime * 2.5);
      
      // Displacement amplitude increases with stress (0 -> 0.4)
      float displacement = (waveX + waveZ) * (uStress * 0.4);
      
      pos.y += displacement;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uStress;
    varying vec2 vUv;

    // --- Correct 2D Simplex Noise implementation ---
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);

      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;

      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));

      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;

      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;

      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    // -----------------------------------------------

    void main() {
      // Flow logic
      float flowSpeed = 2.0 + (uStress * 4.0);
      vec2 flowUV = vUv;
      
      // Animate UV
      flowUV.x -= uTime * 0.1 * flowSpeed; 
      
      // Noise
      float noiseVal = snoise(flowUV * vec2(10.0, 1.0)); 
      
      // Color
      vec3 waterColor = uColor;
      vec3 foamColor = vec3(0.9, 0.95, 1.0);
      
      // Mix
      vec3 finalColor = mix(waterColor, foamColor, smoothstep(0.4, 0.7, noiseVal));
      
      gl_FragColor = vec4(finalColor, 0.85);
    }
  `
);

extend({ RiverWaterMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      riverWaterMaterial: any;
    }
  }
}

export default function River() {
  const { stressLevel } = useStore();
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    // Radius 4.5 ensures visibility without clipping too much into terrain
    // Increased radial segments to 16 for better wave definition
    const geo = new THREE.TubeGeometry(riverCurve, 64, 4.5, 16, false);
    return geo;
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      materialRef.current.uStress = stressLevel;

      // Color: Blue -> Muddy Brown
      const cleanColor = new THREE.Color("#60a5fa");
      const dirtyColor = new THREE.Color("#4e342e");
      materialRef.current.uColor.lerpColors(cleanColor, dirtyColor, stressLevel);
    }

    if (meshRef.current) {
      // Flatten the tube to make the top surface flat
      meshRef.current.scale.y = 0.1;

      // Height adjustment relative to terrain
      // Stress 0 -> y = -1.3 (User High Water)
      // Stress 1 -> y = -3.3 (Low Water)
      const waterHeight = 2.3 * (1 - stressLevel);
      meshRef.current.position.y = -3.3 + waterHeight;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[0, 0, 0]}>
      {/* DoubleSide to prevent culling */}
      {/* @ts-ignore */}
      <riverWaterMaterial ref={materialRef} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}