// app/components/RegisterModal.tsx
'use client'; // Indica que este componente es un Client Component en Next.js

import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import NotificationToast from './NotificationToast';

/**
 * @interface RegisterModalProps
 * @description Define las propiedades para el componente RegisterModal.
 */
interface RegisterModalProps {
  onClose: () => void; // Función para cerrar el modal
  onSuccess?: () => void; // Función para manejar el éxito del registro (opcional)
  isPendingRedirect?: boolean; // Nueva prop para indicar si hay un redireccionamiento pendiente
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

/**
 * @function RegisterModal
 * @description Componente de React para el formulario de registro de usuarios.
 * Permite a los usuarios ingresar nombre de usuario, correo electrónico y contraseña,
 * y envía estos datos a la API de registro.
 * @param {RegisterModalProps} props Las propiedades del componente.
 * @returns {JSX.Element} El componente del modal de registro.
 */
const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onSuccess, isPendingRedirect = false }) => {
  // Estados para los campos del formulario
  const [username, setUsername] = useState('');
  const [Tag, setTag] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estado para el estado de carga (mientras se envía la solicitud)
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

  /**
   * @function handleSubmit
   * @description Maneja el envío del formulario de registro.
   * Valida los campos, envía los datos a la API y muestra notificaciones al usuario.
   * @param {React.FormEvent} e El evento de envío del formulario.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario (recarga de página)
    hideNotification(); // Oculta cualquier notificación anterior
    setIsLoading(true); // Activa el estado de carga

    // Validación de contraseñas
    if (password !== confirmPassword) {
      showNotification('Las contraseñas no coinciden.', 'error');
      setIsLoading(false);
      return;
    }

    // Validación básica de campos
    if (!username.trim() || !Tag.trim() || !email.trim() || !password.trim()) {
      showNotification('Por favor, completa todos los campos.', 'warning');
      setIsLoading(false);
      return;
    }

    // Validación del tag (debe empezar con #)
    if (!Tag.startsWith('#')) {
      showNotification('El tag debe empezar con #', 'warning');
      setIsLoading(false);
      return;
    }

    // Validación de longitud del tag (máximo 5 caracteres)
    if (Tag.length > 5) {
      showNotification('El tag no puede tener más de 5 caracteres (incluyendo #)', 'warning');
      setIsLoading(false);
      return;
    }

    // Validación de contenido del tag (solo debe contener # y números/letras)
    if (!/^#[a-zA-Z0-9]+$/.test(Tag)) {
      showNotification('El tag solo puede contener letras y números después del #', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      // Realiza una solicitud POST a la ruta de API de registro
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, tag: Tag, email, password }), // Envía los datos como JSON
      });

      const data = await response.json(); // Parsea la respuesta JSON del servidor

      if (response.ok) { // Si la respuesta es exitosa (código de estado 2xx)
        showNotification('¡Registro exitoso! Serás redirigido al login en unos segundos...', 'success');

        // Llama a la función onSuccess solo si está definida y es una función
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }

        // Ya no cerramos el modal aquí, se maneja desde el componente padre
      } else { // Si la respuesta indica un error
        const errorMessage = data.message || 'Error al registrar el usuario.';
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      showNotification('Error de conexión. Verifica tu internet e inténtalo de nuevo.', 'error');
    } finally {
      setIsLoading(false); // Desactiva el estado de carga
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

      {/* Modal de Registro */}
      <div className="fixed inset-0 flex justify-center items-center z-50 bg-opacity-30 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-500">Registrarse</h2>

          {/* Botón para cerrar el modal */}
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
            {/* Campo de Nombre de Usuario */}
            <div className="flex space-x-4">
              {/* Campo de Nombre de Usuario */}
              <div className="flex-1">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-5 py-2.5 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:outline-none transition-all duration-300 ease-in-out shadow-sm hover:shadow-inner"
                  placeholder="Tu nombre de usuario"
                  disabled={isLoading || isPendingRedirect}
                />
              </div>
              
              {/* Campo de Tag */}
              <div className="w-1/4">
                <label htmlFor="Tag" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Tag
                </label>
                <input
                  type="text"
                  id="Tag"
                  value={Tag}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 5) {
                      setTag(value);
                    }
                  }}
                  required
                  maxLength={5}
                  className="w-full px-4 py-2.5 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:outline-none transition-all duration-300 ease-in-out shadow-sm hover:shadow-inner"
                  placeholder="#123"
                  disabled={isLoading || isPendingRedirect}
                />
                
              </div>
            </div>

            {/* Campo de Correo Electrónico */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-2.5 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:outline-none transition-all duration-300 ease-in-out shadow-sm hover:shadow-inner"
                placeholder="tu@ejemplo.com"
                disabled={isLoading || isPendingRedirect}
              />
            </div>

            {/* Campo de Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
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
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-600 hover:text-blue-800"
                  disabled={isLoading || isPendingRedirect}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Campo de Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-5 py-2.5 pr-12 border-2 text-gray-700 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:outline-none transition-all duration-300 ease-in-out shadow-sm hover:shadow-inner"
                  placeholder="********"
                  disabled={isLoading || isPendingRedirect}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-600 hover:text-blue-800"
                  disabled={isLoading || isPendingRedirect}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Botón de Envío */}
            <div className='flex justify-center'>
              <button
                type="submit"
                disabled={isLoading || isPendingRedirect}
                className={`w-full font-semibold text-white px-5 py-2.5 text-center rounded-full transition-all duration-300 ease-in-out shadow-md hover:shadow-lg
                  ${(isLoading || isPendingRedirect)
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300'
                  }`}
              >
                {isPendingRedirect 
                  ? 'Redirigiendo...' 
                  : isLoading 
                    ? 'Registrando...' 
                    : 'Registrarse'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegisterModal;