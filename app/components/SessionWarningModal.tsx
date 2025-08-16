// app/components/SessionWarningModal.tsx
'use client';

import { useSessionTimeout, formatTimeRemaining } from '../hooks/useSessionTimeout';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface SessionWarningModalProps {
  warningMinutes?: number;
}

export function SessionWarningModal({ warningMinutes = 5 }: SessionWarningModalProps) {
  const { timeRemaining, isExpiringSoon, extendSession } = useSessionTimeout(warningMinutes);
  const [isExtending, setIsExtending] = useState(false);

  if (!isExpiringSoon) return null;

  const handleExtend = async () => {
    try {
      setIsExtending(true);
      await extendSession();
      console.log('Sesión extendida exitosamente desde modal');
    } catch (error) {
      console.error('Error al extender la sesión:', error);
      // Si hay error, el hook ya manejará el logout automático
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = () => {
    signOut({ 
      callbackUrl: '/',
      redirect: true 
    });
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Sesión por expirar
          </h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Tu sesión expirará en {formatTimeRemaining(timeRemaining)}. 
          ¿Deseas continuar o cerrar sesión?
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleLogout}
            disabled={isExtending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cerrar sesión
          </button>
          <button
            onClick={handleExtend}
            disabled={isExtending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isExtending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extendiendo...
              </>
            ) : (
              'Continuar sesión'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}