"use client";
import { useStore } from "@/store/useStore";
import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";
import { riverCurve } from "@/utils/terrainLogic";
import { shaderMaterial } from "@react-three/drei";

// Shader Material pour l'eau HUILÉE (Oil River)
const RiverWaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#60a5fa"),
    uStress: 0,
    uViewPos: new THREE.Vector3(),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vViewPosition;
    varying vec3 vNormal;

    uniform float uTime;
    uniform float uStress;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Phase 3: Heavy Oil Turbulence
      // Slower, heavier waves than water
      float waveX = sin(pos.x * 1.0 + uTime * 1.5);
      float waveZ = sin(pos.z * 0.8 + uTime * 1.2);
      
      // Viscous heaving (amplitude increases with stress)
      float displacement = (waveX + waveZ) * (uStress * 0.5);
      pos.y += displacement;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // For Fresnel
      vViewPosition = -mvPosition.xyz;
      vNormal = normalMatrix * normal;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uStress;
    
    varying vec2 vUv;
    varying vec3 vViewPosition;
    varying vec3 vNormal;

    // Simplex Noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ; m = m*m ;
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

    void main() {
      // Flow
      float flowSpeed = 1.0 + (uStress * 2.0); // Oil flows slower than water
      vec2 flowUV = vUv;
      flowUV.x -= uTime * 0.05 * flowSpeed; 
      
      // Noise patterns (Oil slicks)
      float noiseVal = snoise(flowUV * vec2(8.0, 2.0)); 
      
      // Base Mixing
      // uColor (Blue -> Mud) mixed with Black Oil spots
      vec3 oilColor = vec3(0.02, 0.02, 0.02); // Almost black
      // Reduced oil influence for cleaner colors at low stress
      vec3 waterColor = mix(uColor, oilColor, uStress * 0.8); 
      
      // Fresnel Effect (Shiny surface)
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
      
      // Oil Sheen (Fake rainbow/specular)
      vec3 sheenColor = vec3(0.4, 0.4, 0.5); // Metallic sheen
      
      vec3 finalColor = mix(waterColor, sheenColor, fresnel * 0.5);
      
      // Foam (Lighter foam)
      float foamThreshold = 0.6 - (uStress * 0.1); 
      vec3 foamColor = vec3(0.8, 0.9, 1.0); // White/Blueish foam (cleaner)
      finalColor = mix(finalColor, foamColor, smoothstep(foamThreshold, foamThreshold + 0.1, noiseVal));

      gl_FragColor = vec4(finalColor, 0.9);
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
    // TubeGeometry is fine IF we flatten it heavily
    // 64 segments, radius 5.0 (wider), 16 radial segments
    return new THREE.TubeGeometry(riverCurve, 64, 5.0, 16, false);
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      // Keep stress minimal for visuals (clean water)
      materialRef.current.uStress = 0; // Fixed at 0 for clean look

      // Color: Blue Ciel (Sky Blue)
      const cleanColor = new THREE.Color("#38bdf8"); // Sky Blue 400
      materialRef.current.uColor.set(cleanColor);
    }

    if (meshRef.current) {
      // Flatten into a ribbon/surface
      meshRef.current.scale.y = 0.05; // Very flat
      meshRef.current.scale.x = 1.0;

      // Height: Reacts to stress again
      // Stress 0 -> -1.2 (High Water)
      // Stress 1 -> -3.7 (Low Water)
      const waterLevel = -1.2 - (stressLevel * 2.5);
      meshRef.current.position.y = waterLevel;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[0, 0, 0]}>
      {/* @ts-ignore */}
      <riverWaterMaterial ref={materialRef} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}