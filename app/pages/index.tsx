// pages/index.js
import { useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import ProfilePage from './profile'; 

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado para simular el login

  // Simulación de un usuario logueado. En un entorno real, usarías un contexto o Redux.
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleRegisterSuccess = () => {
    // Después de un registro exitoso, podrías iniciar sesión automáticamente
    setIsLoggedIn(true);
    setShowRegisterModal(false);
  };

  if (isLoggedIn) {
    return <ProfilePage />; // Muestra la página de perfil si el usuario está logueado
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head>
        <title>Anime Organizer</title>
        <meta name="description" content="Organiza tus series y animes vistos" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header
        onLoginClick={() => setShowLoginModal(true)}
        onRegisterClick={() => setShowRegisterModal(true)}
        isLoggedIn={isLoggedIn} // Pasa el estado de login al Header
        onLogout={() => setIsLoggedIn(false)} // Función para cerrar sesión
      />

      <main className="flex-grow container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Organiza tus Series y Animes
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Lleva un control de lo que has visto, lo que estás viendo y lo que planeas ver.
          Nunca más pierdas el hilo de tus historias favoritas.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            Regístrate Ahora
          </button>
          <button
            onClick={() => setShowLoginModal(true)}
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition duration-300"
          >
            Ya tengo cuenta
          </button>
        </div>
      </main>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
    </div>
  );
}