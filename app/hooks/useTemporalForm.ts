// hooks/useTemporalForm.ts
import { useState, useEffect } from 'react';

export function useTemporalForm<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    // Solo en cliente
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch (error) {
      console.error('Error al leer sessionStorage:', error);
      return initialValue;
    }
  });

  useEffect(() => {
    // Guardar en sessionStorage cada cambio
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error('Error al guardar en sessionStorage:', error);
      }
    }
  }, [state, key]);

  return [state, setState] as const;
}