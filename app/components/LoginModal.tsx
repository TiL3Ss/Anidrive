// app/components/LoginModal.tsx
'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { signIn } from 'next-auth/react';
import NotificationToast from './NotificationToast';

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  isPendingRedirect?: boolean; // Nueva prop para manejar el estado de redireccionamiento
}

/**
 * @interface NotificationState
 * @description Estado para manejar las notificaciones
 */
interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess, isPendingRedirect = false }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para las notificaciones
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });

  /**
   * @function showNotification
   * @description Muestra una notificación con el mensaje y tipo especificados
   */
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      show: true,
      message,
      type
    });
  };

  /**
   * @function hideNotification
   * @description Oculta la notificación actual
   */
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hideNotification(); // Oculta cualquier notificación anterior
    setIsLoading(true);

    // Validación básica de campos
    if (!identifier.trim() || !password.trim()) {
      showNotification('Por favor, completa todos los campos.', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      // Llama a signIn con el proveedor 'credentials'
      const result = await signIn('credentials', {
        redirect: false, // Importante: evita la redirección automática por NextAuth.js
        identifier,
        password,
      });

      if (result?.error) {
        // NextAuth.js pasará el mensaje de error de la función authorize
        showNotification(result.error, 'error');
      } else {
        showNotification('¡Inicio de sesión exitoso! Redirigiendo a tu perfil...', 'success');
        
        if (onSuccess) {
          onSuccess(); // Notifica al componente padre (Home) del éxito
        }
        
        // No cerramos el modal aquí, se maneja desde el componente padre
      }
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      showNotification('Error de red o del servidor. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Notificación Toast */}
      {notification.show && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          duration={notification.type === 'success' ? 4000 : 4000}
          onClose={hideNotification}
          persistent={notification.type === 'error' || isPendingRedirect}
        />
      )}

      {/* Modal de Login */}
      <div className="fixed inset-0 flex justify-center items-center z-50 bg-opacity-30 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-500">Iniciar Sesión</h2>
          
          {/* Botón para cerrar el modal - se deshabilita durante el redireccionamiento */}
          <button
            onClick={onClose}
            disabled={isPendingRedirect}
            className={`absolute top-3 right-3 text-2xl font-semibold transition-colors ${
              isPendingRedirect 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:text-red-700'
            }`}
            aria-label="Cerrar"
          >
            &times;
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1 ml-2">
                Correo Electrónico o Nombre de Usuario
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full px-5 py-2.5 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none focus:shadow-outline-blue transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
                placeholder="tu@ejemplo.com o tu_usuario"
                disabled={isLoading || isPendingRedirect}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 ml-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-5 py-2.5 pr-12 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:outline-none transition-all duration-300 ease-in-out shadow-sm hover:shadow-inner"
                  placeholder="********"
                  disabled={isLoading || isPendingRedirect}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-800"
                  disabled={isLoading || isPendingRedirect}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className='flex justify-center'>
              <button
                type="submit"
                disabled={isLoading || isPendingRedirect}
                className={`w-full font-semibold text-white font-medium text-sm px-5 py-2.5 text-center me-2 mb-2 rounded-full transition duration-300 ease-in-out
                  ${(isLoading || isPendingRedirect)
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
                  }`}
              >
                {isPendingRedirect 
                  ? 'Redirigiendo...' 
                  : isLoading 
                    ? 'Iniciando Sesión...' 
                    : 'Iniciar Sesión'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginModal;