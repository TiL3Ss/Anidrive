import React, { useEffect, useRef, useState } from 'react';

const AnimatedBlobBackground: React.FC = () => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      // Importar dinámicamente Vanta y Three.js
      const initVanta = async () => {
        try {
          // Importar Three.js
          const THREE = await import('three');
          // Hacer THREE disponible globalmente
          (window as any).THREE = THREE;
          
          // Importar el efecto TOPOLOGY de Vanta (más parecido a Oceans Eleven)
          const VANTA = await import('vanta/dist/vanta.topology.min.js');
          
          // Crear el efecto con la configuración exacta de neat.firecms.co
          const effect = VANTA.default({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            // Configuración del efecto "Oceans Eleven"
            color: 0x25c5b1,
            backgroundColor: 0xd9e5ea
          });
          
          setVantaEffect(effect);
        } catch (error) {
          console.error('Error loading Vanta:', error);
          
          // Fallback: usar el fondo que creamos anteriormente
          if (vantaRef.current) {
            vantaRef.current.style.background = `
              linear-gradient(135deg, 
                #25C5B1 0%,
                #1B96D4 25%,
                #94CDD2 50%,
                #E9BDA6 75%,
                #D9E5EA 100%)
            `;
          }
        }
      };
      
      initVanta();
    }
    
    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
        setVantaEffect(null);
      }
    };
  }, [vantaEffect]);

  return (
    <div 
      ref={vantaRef}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      style={{
        width: '100%',
        height: '100%'
      }}
    />
  );
};

export default AnimatedBlobBackground;