// components/ProfileHeader.tsx
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface ProfileHeaderProps {
  isOwnProfile: boolean;
  currentUsername: string;
  profileUsername: string;
  userImage?: string;
}

export const ProfileHeader = ({ 
  isOwnProfile, 
  currentUsername, 
  profileUsername, 
  userImage 
}: ProfileHeaderProps) => {
  return (
    <div className="relative bg-gradient-to-r from-blue-200 to-blue-600 pt-16 pb-50">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold text-white mb-1">
          {isOwnProfile ? `Perfil de ${currentUsername}` : `Perfil de ${profileUsername}`}
        </h1>

        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-18">
          <div className="relative w-64 h-64 rounded-full border-4 border-blue-500 bg-blue-500 overflow-hidden flex items-center justify-center">
            {userImage ? (
              <img
                src={userImage}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircleIcon className="w-full h-full text-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
