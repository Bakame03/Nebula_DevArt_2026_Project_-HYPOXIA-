"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/store/useStore";

const LOW_STRESS_SKY = new THREE.Color("#c7d5ff");
const HIGH_STRESS_SKY = new THREE.Color("#1a0505");

export default function ReactiveSky() {
  const stressLevel = useStore((s) => s.stressLevel);
  const bgColor = useRef(new THREE.Color());
  const { scene } = useThree();

  useFrame(() => {
    bgColor.current.lerpColors(LOW_STRESS_SKY, HIGH_STRESS_SKY, stressLevel);
    scene.background = bgColor.current;
  });

  const turbidity = 2 + stressLevel * 28;
  const rayleigh = 0.5 + stressLevel * 3.5;
  const mieCoefficient = 0.005 + stressLevel * 0.03;
  const mieDirectionalG = Math.max(0.1, 0.8 - stressLevel * 0.4);
  const sunX = 50 - stressLevel * 100;
  const sunY = Math.max(0.5, 30 - stressLevel * 28);

  return (
    <Sky
      distance={450000}
      turbidity={turbidity}
      rayleigh={rayleigh}
      mieCoefficient={mieCoefficient}
      mieDirectionalG={mieDirectionalG}
      sunPosition={[sunX, sunY, 50]}
    />
  );
}
