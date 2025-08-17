// app/components/AnimatedBlobBackground.tsx
import React from 'react';

const AnimatedBlobBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div 
        className="w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://neat.firecms.co/assets/bg/oceans_eleven.svg')"
        }}
      />
    </div>
  );
};

export default AnimatedBlobBackground;