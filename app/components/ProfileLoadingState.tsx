// components/ProfileLoadingState.tsx
import Header from './Header';

interface ProfileLoadingStateProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  username: string;
}

export const ProfileLoadingState = ({ 
  isLoggedIn, 
  onLogout, 
  username 
}: ProfileLoadingStateProps) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
        isLoggedIn={isLoggedIn}
        onLogout={onLogout}
        username={username}
      />
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    </div>
  );
};