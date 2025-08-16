// components/ProfileNotFound.tsx
import { useRouter } from 'next/navigation';
import Header from './Header';

interface ProfileNotFoundProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  username: string;
  usernameParam: string;
}

export const ProfileNotFound = ({ 
  isLoggedIn, 
  onLogout, 
  username, 
  usernameParam 
}: ProfileNotFoundProps) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
        isLoggedIn={isLoggedIn}
        onLogout={onLogout}
        username={username}
      />
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-700 mb-4">Perfil no encontrado</h1>
          <p className="text-gray-600 mb-6">El usuario "{usernameParam}" no existe.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition duration-300"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};