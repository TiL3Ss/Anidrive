// hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  tag: string;
  created_at: string;
  animeCount: number;
  isOwnProfile: boolean;
}

export const useProfile = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const usernameParam = params?.username as string;

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeProfile = async () => {
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        router.push('/');
        return;
      }

      if (!usernameParam && session?.user?.name) {
        router.push(`/profile/${session.user.name}`);
        return;
      }

      try {
        const usernameToFetch = usernameParam || session?.user?.name;
        
        if (!usernameToFetch) {
          setProfileNotFound(true);
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/user/profile/${usernameToFetch}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setProfileNotFound(true);
            setIsLoading(false);
            return;
          }
          throw new Error('Error al obtener el perfil');
        }

        const userData = await response.json();
        setProfileUser(userData);
        setIsOwnProfile(userData.isOwnProfile);

      } catch (error) {
        console.error('Error al inicializar perfil:', error);
        setProfileNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, [status, usernameParam, session, router]);

  return {
    profileUser,
    isOwnProfile,
    profileNotFound,
    isLoading,
    currentUsername: session?.user?.name || session?.user?.email || 'Usuario'
  };
};