// components/OceanicBackground.tsx
"use client";

import { NeatGradient } from "@firecms/neat";
import { useRef, useEffect } from "react";

export default function AnimatedBlobBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Inicializa el gradiente Oceanic
      const gradient = new NeatGradient({
        ref: canvasRef.current,
        colors: [
          { color: "#3A7BD5", enabled: true }, // azul
          { color: "#00d2ff", enabled: true }, // celeste
          { color: "#004e92", enabled: true }, // azul profundo
        ],
        speed: 3, // velocidad de animación
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
