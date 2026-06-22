"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";

/**
 * Custom animated cursor.
 * – Circle morphs from round (calm) to sharp (critical)
 * – Color bleeds from cool green → toxic red with stress
 * – Trails the mouse with a soft lerp for a fluid feel
 * – Inner dot pulses at high stress
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Live position refs — no React state to avoid re-renders
  const mouse = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const el = cursorRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!el || !dot || !ring) return;

    // No custom cursor on touch devices: there's no pointer to follow, so skip
    // the 60fps loop entirely (it would otherwise run for an invisible element
    // and waste battery on phones).
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let raf: number;
    let hovering = false;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      el.style.opacity = "1";
    };
    const onLeave = () => { el.style.opacity = "0"; };
    const onEnterInteractive = () => { hovering = true; };
    const onLeaveInteractive = () => { hovering = false; };

    const interactives = document.querySelectorAll("button, a, [role='button']");
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnterInteractive);
      el.addEventListener("mouseleave", onLeaveInteractive);
    });

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);

    const animate = () => {
      const lerpSpeed = 0.12;
      pos.current.x += (mouse.current.x - pos.current.x) * lerpSpeed;
      pos.current.y += (mouse.current.y - pos.current.y) * lerpSpeed;

      el.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;

      const stress = useStore.getState().stressLevel;
      const isCritical = stress > 0.8;

      // Color: green (#00c864) → red (#ff0040)
      const r = Math.round(stress * 255);
      const g = Math.round(200 - stress * 200);
      const color = `rgb(${r},${g},40)`;
      const colorAlpha = `rgba(${r},${g},40,0.35)`;

      // Ring: shrinks & sharpens with stress; expands on hover
      const size = hovering ? 44 : 20 + stress * 6;
      const borderRadius = isCritical ? "20%" : "50%";
      const rotation = isCritical ? `${Date.now() * 0.05}deg` : "0deg";

      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.borderColor = color;
      ring.style.borderRadius = borderRadius;
      ring.style.transform = `translate(-50%, -50%) rotate(${rotation})`;
      ring.style.backgroundColor = hovering ? colorAlpha : "transparent";

      // Inner dot: pulses at high stress
      const dotSize = isCritical ? 5 + Math.sin(Date.now() * 0.008) * 2 : 3;
      dot.style.width = `${dotSize}px`;
      dot.style.height = `${dotSize}px`;
      dot.style.backgroundColor = color;
      dot.style.boxShadow = stress > 0.5 ? `0 0 8px 2px rgba(${r},${g},40,0.6)` : "none";

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", onEnterInteractive);
        el.removeEventListener("mouseleave", onLeaveInteractive);
      });
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed left-0 top-0 z-[500] opacity-0"
      style={{ willChange: "transform" }}
      aria-hidden
    >
      {/* Outer ring */}
      <div
        ref={ringRef}
        className="absolute border transition-[width,height,border-radius,background-color] duration-150"
        style={{
          width: 20,
          height: 20,
          borderWidth: 1,
          borderColor: "#00c864",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="absolute rounded-full"
        style={{
          width: 3,
          height: 3,
          backgroundColor: "#00c864",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
