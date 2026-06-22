"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";

function drawFavicon(stress: number): string {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background
  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, 6);
  ctx.fill();

  // Stress arc (green → red)
  const r = Math.round(0 + stress * 255);
  const g = Math.round(200 - stress * 200);
  const arcColor = `rgb(${r},${g},40)`;

  const cx = size / 2;
  const cy = size / 2;
  const radius = 11;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + Math.PI * 2 * stress;

  // Background ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Stress fill ring
  if (stress > 0.01) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = arcColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Letter "H"
  ctx.fillStyle = stress > 0.7 ? arcColor : "rgba(255,255,255,0.85)";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", cx, cy + 0.5);

  return canvas.toDataURL("image/png");
}

export default function FaviconManager() {
  const stressLevel = useStore((s) => s.stressLevel);
  const linkRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    // Create or find the favicon link element
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    linkRef.current = link;
  }, []);

  // Quantise to ~2% steps so the 32px canvas is only regenerated when the icon
  // would visibly change — not on every keystroke, recovery tick or damage-floor
  // nudge (drawFavicon + toDataURL ran on every one before).
  const faviconStress = Math.round(stressLevel * 50) / 50;

  useEffect(() => {
    if (!linkRef.current) return;
    const dataUrl = drawFavicon(faviconStress);
    if (dataUrl) linkRef.current.href = dataUrl;
  }, [faviconStress]);

  return null;
}
