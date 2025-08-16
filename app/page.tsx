// app/page.tsx
'use client'

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import ProfilePage from './profile/[username]/page';
import AnimatedBlobBackground from './components/AnimatedBlobBackground';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [pendingLoginRedirect, setPendingLoginRedirect] = useState(false);
  const [pendingProfileRedirect, setPendingProfileRedirect] = useState(false);

  const { data: session, status } = useSession();

  const isLoadingSession = status === 'loading';
  const isLoggedIn = status === 'authenticated';

  const username = session?.user?.name || session?.user?.email || null; 

  const handleLoginSuccess = () => {
    // No cerramos el modal inmediatamente, solo marcamos que hay un redireccionamiento pendiente
    setPendingProfileRedirect(true);
    
    // Después de 3 segundos (tiempo suficiente para ver la notificación), 
    // cerramos el modal y la sesión se actualizará automáticamente
    setTimeout(() => {
      setShowLoginModal(false);
      setPendingProfileRedirect(false);
    }, 3000); // 3 segundos para que se vea la notificación
  };

  const handleRegisterSuccess = () => {
    // No cerramos el modal inmediatamente, solo marcamos que hay un redireccionamiento pendiente
    setPendingLoginRedirect(true);
    
    // Después de 3 segundos (tiempo suficiente para ver la notificación), 
    // cerramos el modal de registro y abrimos el de login
    setTimeout(() => {
      setShowRegisterModal(false);
      setPendingLoginRedirect(false);
      setShowLoginModal(true);
    }, 3000); // 3 segundos para que se vea la notificación
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/page' });
  };

  // Función para cerrar el modal de login
  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setPendingProfileRedirect(false); // Resetear el estado si se cierra manualmente
  };

  // Función para cerrar el modal de registro
  const handleCloseRegisterModal = () => {
    setShowRegisterModal(false);
    setPendingLoginRedirect(false); // Resetear el estado si se cierra manualmente
  };

  if (isLoadingSession) {
   
  }

  if (isLoggedIn) {
    return <ProfilePage />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gray-900">
      <Head>
        <title>Anime Organizer</title>
        <meta name="description" content="Organiza tus series y animes vistos" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header
        onLoginClick={() => setShowLoginModal(true)}
        onRegisterClick={() => setShowRegisterModal(true)}
        isLoggedIn={isLoggedIn}
        username={username} 
        onLogout={handleLogout}
        className="relative z-20"
      />

      <main className="flex-grow container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center relative z-20">
        <h1 className="text-5xl font-bold text-white mb-6">
          Organiza tus Series y Animes
        </h1>
        <p className="text-xl text-gray-200 mb-8 max-w-2xl">
          Lleva un control de lo que has visto, lo que estás viendo y lo que planeas ver.
          Nunca más pierdas el hilo de tus historias favoritas.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="bg-gradient-to-b from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg transform"
          >
            Regístrate Ahora
          </button>
          <button
            onClick={() => setShowLoginModal(true)}
            className="border-2 border-blue-200 text-blue-200 px-5 py-2 rounded-full text-base font-semibold hover:bg-blue-900/10 hover:border-blue-100 hover:text-blue-100 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            Ya tengo cuenta
          </button>
        </div>
      </main>

      <AnimatedBlobBackground />

      {showLoginModal && (
        <LoginModal
          onClose={handleCloseLoginModal}
          onSuccess={handleLoginSuccess}
          isPendingRedirect={pendingProfileRedirect}
        />
      )}
      {showRegisterModal && (
        <RegisterModal
          onClose={handleCloseRegisterModal}
          onSuccess={handleRegisterSuccess}
          isPendingRedirect={pendingLoginRedirect}
        />
      )}
    </div>
  );
}