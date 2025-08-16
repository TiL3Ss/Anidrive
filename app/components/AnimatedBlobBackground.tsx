// app/components/AnimatedBlobBackground.tsx
import React from 'react';

const AnimatedBlobBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000" // Aseguramos un viewBox para el escalado
      >
        {/* Blob 1 - Tono de azul más oscuro, base */}
        <path
          className="animated-topography-blob blob-1"
          fill="#1e3a8a" // Un azul oscuro (blue-800)
          d="M 0 300 Q 150 100, 300 300 T 600 350 T 800 200 T 1000 300 L 1000 1000 L 0 1000 Z"
          style={{ animationDelay: '0s' }}
        />
        {/* Blob 2 - Tono de azul intermedio */}
        <path
          className="animated-topography-blob blob-2"
          fill="#2563eb" // Un azul medio (blue-700)
          d="M 0 450 Q 180 250, 400 450 T 700 500 T 900 350 T 1000 450 L 1000 1000 L 0 1000 Z"
          style={{ animationDelay: '2s' }}
        />
        {/* Blob 3 - Tono de azul más claro */}
        <path
          className="animated-topography-blob blob-3"
          fill="#3b82f6" // Un azul más claro (blue-600)
          d="M 0 600 Q 200 400, 500 600 T 800 650 T 950 500 T 1000 600 L 1000 1000 L 0 1000 Z"
          style={{ animationDelay: '4s' }}
        />
        {/* Blob 4 - Tono de azul muy claro (opcional, para más capas) */}
        <path
          className="animated-topography-blob blob-4"
          fill="#60a5fa" // Un azul muy claro (blue-400)
          d="M 0 750 Q 250 550, 600 750 T 900 800 T 1000 650 L 1000 1000 L 0 1000 Z"
          style={{ animationDelay: '6s' }}
        />
      </svg>
    </div>
  );
};

export default AnimatedBlobBackground;