// components/OceanicBackground.tsx
"use client";

import { NeatGradient } from "@firecms/neat";
import { useEffect, useRef } from "react";

export default function OceanicBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const gradient = new NeatGradient({
        ref: canvasRef.current,
        colors: [
          { color: "#3A7BD5", enabled: true }, // Azul
          { color: "#00d2ff", enabled: true }, // Celeste
          { color: "#004e92", enabled: true }, // Azul profundo
        ],
        speed: 3,
        horizontalTilt: true,
        verticalTilt: true,
      });

      return () => gradient.destroy();
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"
    />
  );
}
