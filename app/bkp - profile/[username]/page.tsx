// app/profile/[username]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import AnimeCarousel from '../../components/AnimeCarousel';
import RecommendationsBanner from '../../components/RecommendationsBanner';
import DriveCalendar from '../../components/DriveCalendar';
import AddAnimeModal from '../../components/AddAnimeModal';
import NotificationToast from '../../components/NotificationToast';
import EditAnimeModal from '../../components/EditAnimeModal';
import DELAnimeModal from '../../components/DelAnimeModal';
import AnimeMain from '../../components/AnimeMain';
import AnimeSearchModal from '../../components/SearchAnimeModal';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { PlusCircleIcon, UserCircleIcon, ArrowLeftIcon, MagnifyingGlassIcon} from '@heroicons/react/24/outline'; 

interface AnimeWatching {
  id: number;
  title: string;
  imageUrl: string | null;
  currentEpisode: number | null;
  totalChapters: number | null;
}

interface AnimeDrive {
  id: number;
  title: string;
  imageUrl: string | null;
  rating?: string | null;
  currentEpisode?: number | null;
  totalChapters?: number | null;
  seasonCour: string;
  year: number;
  seasonName: string | null;
  state_name: string | null;
  recommended: string | null;
  seasonColor?: string;
  review: string | null; 
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface SeasonData {
  year: number;
  seasons: {
    name: string | null;
    color: string;
    animes: AnimeDrive[];
  }[];
}

interface UserAnime {
  id: number;
  title: string;
  imageUrl: string | null;
  currentEpisode: number | null;
  totalChapters: number | null;
  state: string; 
  rating: string | null;
  year: number;
  season: string;
  seasonCour: string;
  recommended: boolean;
}

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  tag: string;
  created_at: string;
  animeCount: number;
  isOwnProfile: boolean;
}

const getSeasonColor = (seasonName: string | null): string => {
  switch (seasonName?.toLowerCase()) {
    case 'invierno':
      return 'bg-blue-500';
    case 'primavera':
      return 'bg-green-600';
    case 'verano':
      return 'bg-yellow-400';
    case 'otoño':
      return 'bg-orange-600';
    default:
      return 'bg-gray-200';
  }
};

export default function DynamicProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const usernameParam = params?.username as string;

  // Estados principales del perfil
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de datos de anime - ESTOS AHORA SERÁN DEL PERFIL VISITADO
  const [animesWatching, setAnimesWatching] = useState<AnimeWatching[]>([]);
  const [driveData, setDriveData] = useState<SeasonData[]>([]);
  
  // Estados de UI
  const [viewState, setViewState] = useState<'drive' | 'season' | 'anime'>('drive');
  const [selectedSeason, setSelectedSeason] = useState<SeasonData['seasons'][0] | null>(null);
  const [selectedAnime, setSelectedAnime] = useState<AnimeDrive | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [cameFromSearch, setCameFromSearch] = useState(false);
  const [cameFromRecommendations, setCameFromRecommendations] = useState(false);

  // Estados de modales
  const [showAddAnimeModal, setShowAddAnimeModal] = useState(false);
  const [showEditAnimeModal, setShowEditAnimeModal] = useState(false);
  const [showDelAnimeModal, setShowDelAnimeModal] = useState(false);
  const [showSearchAnimeModal, setshowSearchAnimeModal] = useState(false);

  const currentUsername = session?.user?.name || session?.user?.email || 'Usuario';

  // Efecto principal para inicializar el perfil
  useEffect(() => {
    const initializeProfile = async () => {
      if (status === 'loading') return;

      // Si no hay sesión, redirigir al login
      if (status === 'unauthenticated') {
        router.push('/');
        return;
      }

      // Si no hay usernameParam, redirigir al perfil del usuario actual
      if (!usernameParam && session?.user?.name) {
        router.push(`/profile/${session.user.name}`);
        return;
      }

      try {
        // Determinar qué username usar
        const usernameToFetch = usernameParam || session?.user?.name;
        
        if (!usernameToFetch) {
          setProfileNotFound(true);
          setIsLoading(false);
          return;
        }

        console.log('Inicializando perfil para:', usernameToFetch);

        // Obtener datos del perfil usando la API
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
        console.log('Datos del perfil obtenidos:', userData);
        
        setProfileUser(userData);
        setIsOwnProfile(userData.isOwnProfile);

      } catch (error) {
        console.error('Error al inicializar perfil:', error);
        setNotification({
          message: 'Error al cargar el perfil',
          type: 'error'
        });
        setProfileNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, [status, usernameParam, session, router]);

  // Efecto para cargar datos de anime cuando se carga el perfil
  useEffect(() => {
    if (profileUser) {
      console.log('Cargando datos de anime para usuario ID:', profileUser.id);
      fetchAnimesData();
    }
  }, [profileUser]);

  // Función para obtener datos de anime DEL PERFIL VISITADO
  const fetchAnimesData = async () => {
    if (!profileUser) {
      console.warn('No hay profileUser, no se pueden cargar datos de anime');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Obteniendo datos de anime para usuario:', profileUser.username, 'ID:', profileUser.id);

      // --- FETCH PARA ANIMES VIENDO (usando profileUser.id) ---
      const watchingResponse = await fetch(`/api/animes?userId=${profileUser.id}&state=viendo`);

      let watchingData: any;
      try {
        watchingData = await watchingResponse.json();
      } catch (jsonParseError) {
        console.error('Error al parsear JSON de watchingResponse:', jsonParseError);
        const rawText = await watchingResponse.text();
        console.error('Contenido crudo de watchingResponse:', rawText);
        throw new Error(`Respuesta inválida de la API de animes viendo: "${rawText.substring(0, 100)}..."`);
      }

      if (!watchingResponse.ok) {
        console.error('API de animes viendo respondió con error:', watchingData.detail || watchingData.message);
        throw new Error(watchingData.message || 'Error al obtener animes viendo');
      }

      const formattedWatchingAnimes: AnimeWatching[] = watchingData.map((anime: any) => ({
        id: anime.id,
        title: anime.name,
        imageUrl: anime.image_url,
        currentEpisode: anime.current_chapter,
        totalChapters: anime.total_chapters,
      }));
      
      console.log('Animes viendo obtenidos:', formattedWatchingAnimes.length);
      setAnimesWatching(formattedWatchingAnimes);

      // --- FETCH PARA DRIVE DATA (usando profileUser.id) ---
      const driveResponse = await fetch(`/api/animes?userId=${profileUser.id}`);

      let driveRawData: any;
      try {
        driveRawData = await driveResponse.json();
      } catch (jsonParseError) {
        console.error('Error al parsear JSON de driveResponse:', jsonParseError);
        const rawText = await driveResponse.text();
        console.error('Contenido crudo de driveResponse:', rawText);
        throw new Error(`Respuesta inválida de la API del drive: "${rawText.substring(0, 100)}..."`);
      }

      if (!driveResponse.ok) {
        console.error('API del drive respondió con error:', driveRawData.detail || driveRawData.message);
        throw new Error(driveRawData.message || 'Error al obtener datos del drive');
      }

      console.log('Datos del drive obtenidos:', driveRawData.length, 'animes');

      // Agrupar datos por año y temporada
      const groupedDriveData = driveRawData.reduce((acc: SeasonData[], anime: any) => {
        const year = anime.year;
        const seasonName = anime.season_name;
        const seasonColor = getSeasonColor(seasonName);

        let yearEntry = acc.find((entry) => entry.year === year);
        if (!yearEntry) {
          yearEntry = { year, seasons: [] };
          acc.push(yearEntry);
        }

        let seasonEntry = yearEntry.seasons.find((s) => s.name === seasonName);
        if (!seasonEntry) {
          seasonEntry = { name: seasonName, color: seasonColor, animes: [] };
          yearEntry.seasons.push(seasonEntry);
        }

        seasonEntry.animes.push({
          id: anime.id,
          title: anime.name,
          imageUrl: anime.image_url,
          rating: anime.rating_value,
          currentEpisode: anime.current_chapter,
          totalChapters: anime.total_chapters,
          seasonCour: anime.season,
          state_name: anime.state_name,
          year: anime.year,
          seasonName: anime.season_name,
          recommended: anime.recommended,
          review: anime.review, 
        });
        return acc;
      }, [] as SeasonData[]);

      // Ordenar por año descendente
      groupedDriveData.sort((a, b) => b.year - a.year);
      setDriveData(groupedDriveData);

      console.log('Drive data procesado:', groupedDriveData.length, 'años');

    } catch (error) {
      console.error('Error general al obtener datos de anime:', error);
      setNotification({
        message: 'Error al cargar los datos. Por favor intenta nuevamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para actualizar anime seleccionado cuando cambian los datos
  useEffect(() => {
    if (selectedAnime && driveData.length > 0) {
      const updatedAnime = findAnimeInDriveData(selectedAnime.id);
      if (updatedAnime) {
        if (JSON.stringify(updatedAnime) !== JSON.stringify(selectedAnime)) {
          setSelectedAnime(updatedAnime);
        }
      }
    }
  }, [driveData]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleDeleteAnime = async (animeId: number) => {
    if (!isOwnProfile) {
      setNotification({
        message: 'No tienes permisos para eliminar este anime',
        type: 'error'
      });
      return;
    }

    try {
      const response = await fetch('/api/user/animes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeId })
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el anime');
      }

      setNotification({
        message: 'Anime eliminado correctamente',
        type: 'success'
      });

      setShowDelAnimeModal(false);
      fetchAnimesData();
      setViewState('drive');
      setSelectedAnime(null);
    } catch (error) {
      console.error('Error deleting anime:', error);
      setNotification({
        message: 'Error al eliminar el anime',
        type: 'error'
      });
    }
  };

  const handleRecommendationClick = (userAnime: UserAnime) => {
    const animeDriveData: AnimeDrive = {
      id: userAnime.id,
      title: userAnime.title,
      imageUrl: userAnime.imageUrl,
      rating: userAnime.rating,
      currentEpisode: userAnime.currentEpisode,
      totalChapters: userAnime.totalChapters,
      seasonCour: userAnime.seasonCour,
      year: userAnime.year,
      seasonName: userAnime.season,
      state_name: userAnime.state,
      recommended: userAnime.recommended ? 'true' : 'false',
      seasonColor: getSeasonColor(userAnime.season),
      review: null
    };

    setSelectedAnime(animeDriveData);
    setCameFromRecommendations(true);
    setCameFromSearch(false);
    setViewState('anime');
  };

  const handleAddAnimeSuccess = (message: string) => {
    setShowAddAnimeModal(false);
    setNotification({
      message: message,
      type: 'success',
    });
    fetchAnimesData();
  };

  const handleAddAnimeError = (message: string) => {
    setNotification({
      message: message,
      type: 'error',
    });
  };

  const handleEditAnimeSuccess = (message: string) => {
    setNotification({
      message: message,
      type: 'success',
    }); 
    setShowEditAnimeModal(false);
    fetchAnimesData();
    setTimeout(() => {
      setViewState('drive');
      setSelectedAnime(null);
      setCameFromSearch(false);
      setCameFromRecommendations(false);
    });
  }

  const handleEditAnimeError = (message: string) => {
    setNotification({
      message: message,
      type: 'error',
    });
  };

  const handleDelAnimeSuccess = (message: string) => {
    setShowDelAnimeModal(false);
    setNotification({
      message: message,
      type: 'error',
    });
  };

  const handleDelAnimeError = (message: string) => {
    setNotification({
      message: message,
      type: 'error',
    });
  };

  // Función auxiliar para encontrar anime en drive data
  const findAnimeInDriveData = (animeId: number): AnimeDrive | null => {
    for (const yearData of driveData) {
      for (const season of yearData.seasons) {
        const foundAnime = season.animes.find(anime => anime.id === animeId);
        if (foundAnime) {
          return foundAnime;
        }
      }
    }
    return null;
  };

  // Crear lista de todos los animes del usuario para recomendaciones
  const allUserAnimes: UserAnime[] = driveData.flatMap((yearEntry) =>
    yearEntry.seasons.flatMap((seasonEntry) =>
      seasonEntry.animes.map((anime) => ({
        id: anime.id,
        title: anime.title,
        imageUrl: anime.imageUrl,
        currentEpisode: anime.currentEpisode,
        totalChapters: anime.totalChapters,
        state: anime.state_name || 'desconocido',
        rating: anime.rating || null,
        year: anime.year,
        season: anime.seasonName || '???',
        recommended: anime.recommended === 'true' || anime.recommended === true,
        seasonCour: anime.seasonCour || '???',
      }))
    )
  );

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header
          isLoggedIn={!!session}
          onLogout={handleLogout}
          username={currentUsername}
        />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si no se encuentra el perfil
  if (profileNotFound) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header
          isLoggedIn={!!session}
          onLogout={handleLogout}
          username={currentUsername}
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
  }

  if (!profileUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head>
        <title>{isOwnProfile ? 'Mi Perfil' : `Perfil de ${profileUser.username}`} - AnimeDrive</title>
      </Head>

      <Header
        isLoggedIn={!!session}
        onLogout={handleLogout}
        username={currentUsername}
      />
      
      <main className="flex-grow">
        {/* Sección superior con fondo y avatar */}
        <div className="relative bg-gradient-to-r from-blue-200 to-blue-600 pt-16 pb-50">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-6xl font-bold text-white mb-1">
              {isOwnProfile ? `Perfil de ${currentUsername}` : `Perfil de ${profileUser.username}`}
            </h1>

            {/* Avatar circular que se desborda */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-18">
              <div className="relative w-64 h-64 rounded-full border-4 border-blue-500 bg-blue-500 overflow-hidden flex items-center justify-center">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
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
        
        {/* Contenido principal */}
        <div className="container mx-auto px-4 py-8 pt-24 bg-gray-50">
          {viewState === 'drive' && (
            <>
              <section className="mb-12">
                <RecommendationsBanner 
                  userAnimes={allUserAnimes} 
                  onAnimeClick={handleRecommendationClick}
                  isOwnProfile={isOwnProfile}
                  profileUsername={profileUser.username}
                  profileUserId={profileUser.id}
                />
                <div className="flex items-center mb-6">
                  <h2 className="text-3xl font-semibold text-gray-700">
                    {isOwnProfile ? 'Viendo Actualmente' : `${profileUser.username} está viendo`}
                  </h2>
                  
                  {/* Solo mostrar botones de acción si es el propio perfil */}
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => setShowAddAnimeModal(true)}
                        className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition duration-300 flex items-center"
                      >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Añadir Anime
                      </button>
                      <button
                        onClick={() => setshowSearchAnimeModal(true)}
                        className="ml-4 bg-orange-400 text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-700 transition duration-300 flex items-center"
                      >
                        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                        Buscar
                      </button>
                    </>
                  )}
                </div>
                
                {animesWatching.length > 0 ? (
                  <AnimeCarousel 
                    animes={animesWatching}
                    onAnimeClick={(watchingAnime) => {
                      const fullAnimeData = findAnimeInDriveData(watchingAnime.id);
                      
                      if (fullAnimeData) {
                        setSelectedAnime(fullAnimeData);
                        setCameFromSearch(true); 
                        setViewState('anime');
                      } else {
                        const basicAnimeData: AnimeDrive = {
                          id: watchingAnime.id,
                          title: watchingAnime.title,
                          imageUrl: watchingAnime.imageUrl,
                          rating: null,
                          currentEpisode: watchingAnime.currentEpisode,
                          totalChapters: watchingAnime.totalChapters,
                          seasonCour: '',
                          year: new Date().getFullYear(),
                          seasonName: null,
                          state_name: 'viendo',
                          seasonColor: getSeasonColor(null),
                          review: null
                        };
                        
                        setSelectedAnime(basicAnimeData);
                        setCameFromSearch(true);
                        setViewState('anime');
                      }
                    }}
                  />
                ) : (
                  <p className="text-gray-600">
                    {isOwnProfile ? 'No estás viendo ningún anime actualmente.' : `${profileUser.username} no está viendo ningún anime actualmente.`}
                  </p>
                )}
              </section>

              <section>
                <h2 className="text-3xl font-semibold text-gray-700 mb-6">
                  {isOwnProfile ? 'Tu Drive' : `Drive de ${profileUser.username}`}
                </h2>
                {driveData.length > 0 ? (
                  <DriveCalendar
                    data={driveData}
                    onSeasonClick={(seasonData) => {
                      setSelectedSeason(seasonData);
                      setViewState('season');
                    }}
                    onAnimeClick={(animeData) => {
                      setSelectedAnime(animeData);
                      setCameFromSearch(false);
                      setCameFromRecommendations(false);
                      setViewState('anime');
                    }}
                    viewState={viewState}
                    selectedSeason={selectedSeason}
                    selectedAnime={selectedAnime}
                  />
                ) : (
                  <p className="text-gray-600">
                    {isOwnProfile ? 'Aún no tienes animes en tu Drive.' : `${profileUser.username} aún no tiene animes en su Drive.`}
                  </p>
                )}
              </section>
            </>
          )}

          {viewState === 'season' && selectedSeason && (
            <div className="relative">
              <button
                onClick={() => {
                  setViewState('drive');
                  setSelectedSeason(null);
                }}
                className="absolute top-5 left-5 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition duration-300 z-10"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <DriveCalendar
                data={[{ year: selectedSeason.year, seasons: [selectedSeason] }]}
                onSeasonClick={(seasonData) => {
                  setSelectedSeason(seasonData);
                  setViewState('season');
                }}
                onAnimeClick={(animeData) => {
                  setSelectedAnime(animeData);
                  setCameFromSearch(false);
                  setViewState('anime');
                }}
                viewState={viewState}
                selectedSeason={selectedSeason}
                selectedAnime={selectedAnime}
              />
            </div>
          )}

          {viewState === 'anime' && selectedAnime && (
            <AnimeMain
              selectedAnime={selectedAnime}
              onBack={() => {
                if (cameFromSearch || cameFromRecommendations) { 
                  setViewState('drive');
                  setCameFromSearch(false);
                  setCameFromRecommendations(false); 
                } else {
                  setViewState('season');
                }
                setSelectedAnime(null);
              }}
              onEdit={() => isOwnProfile && setShowEditAnimeModal(true)}
              onDelete={() => isOwnProfile && setShowDelAnimeModal(true)}
              onReviewUpdate={(newReview) => {
                setSelectedAnime(prev => ({ ...prev, review: newReview }));
              }}
              username={profileUser.username}
              backToSeason={!cameFromSearch && !cameFromRecommendations}
              isOwnProfile={isOwnProfile}
            />
          )}

          {/* Modales - Solo se muestran si es el propio perfil */}
          {isOwnProfile && (
            <>
              {showSearchAnimeModal && (
                <AnimeSearchModal 
                  isOpen={showSearchAnimeModal}
                  onClose={() => setshowSearchAnimeModal(false)}
                  onAnimeSelect={(anime) => { 
                    const formattedAnime: AnimeDrive = {
                      id: anime.id,
                      title: anime.name,
                      imageUrl: anime.image_url,
                      rating: anime.rating_value || null,
                      currentEpisode: anime.current_chapter || null,
                      totalChapters: anime.total_chapters || null,
                      seasonCour: anime.season || '',
                      year: anime.year || new Date().getFullYear(),
                      seasonName: anime.season_name || null,
                      state_name: anime.state_name || null,
                      seasonColor: getSeasonColor(anime.season_name),
                      review: anime.review || null
                    };
                    
                    setSelectedAnime(formattedAnime);
                    setshowSearchAnimeModal(false); 
                    setCameFromSearch(true); 
                    setViewState('anime');
                  }} 
                />
              )}

              {showAddAnimeModal && (
                <AddAnimeModal
                  onClose={() => setShowAddAnimeModal(false)}
                  onSuccess={handleAddAnimeSuccess}
                  onError={handleAddAnimeError}
                />
              )}

              {showEditAnimeModal && selectedAnime && (
                <EditAnimeModal
                  animeData={selectedAnime}
                  onClose={() => setShowEditAnimeModal(false)}
                  onSuccess={handleEditAnimeSuccess}
                  onError={handleEditAnimeError}
                />
              )}

              {showDelAnimeModal && selectedAnime && (
                <DELAnimeModal
                  anime={{
                    id: selectedAnime.id,
                    name: selectedAnime.title,
                    image_url: selectedAnime.imageUrl || ''
                  }}
                  onClose={() => setShowDelAnimeModal(false)}
                  onDelete={handleDeleteAnime}
                />
              )}
            </>
          )}
        </div>
      </main>

      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}