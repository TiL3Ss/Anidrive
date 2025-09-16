// components/RecommendationsBanner.tsx
import React, { useState, useEffect } from 'react';
import { PlusCircleIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIcon2, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

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

interface RecommendationsBannerProps {
  userAnimes: UserAnime[];
  onRecommendationsChange?: (recommendations: UserAnime[]) => void;
  onAnimeClick?: (anime: UserAnime) => void;
  isOwnProfile?: boolean;
  profileUsername?: string;
  profileUserId?: number;
}

const RecommendationsBanner: React.FC<RecommendationsBannerProps> = ({
  userAnimes,
  onRecommendationsChange,
  onAnimeClick,
  isOwnProfile = true,
  profileUsername = 'Usuario',
  profileUserId
}) => {
  const [recommendations, setRecommendations] = useState<UserAnime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableAnimes, setAvailableAnimes] = useState<UserAnime[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const updateRecommendationStatus = async (animeId: number, recommended: boolean) => {
    if (!isOwnProfile) {
      console.warn('No se pueden modificar recomendaciones en perfil ajeno');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/animes/recommend', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animeId,
          recommended
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar recomendación');

      if (recommended) {
        const animeToAdd = availableAnimes.find(a => a.id === animeId);
        if (animeToAdd) {
          const updatedAnime = { ...animeToAdd, recommended: true };
          setRecommendations(prev => [...prev, updatedAnime]);
          setAvailableAnimes(prev => prev.filter(a => a.id !== animeId));
        }
      } else {
        const animeToRemove = recommendations.find(a => a.id === animeId);
        if (animeToRemove) {
          const updatedAnime = { ...animeToRemove, recommended: false };
          setRecommendations(prev => prev.filter(a => a.id !== animeId));
          setAvailableAnimes(prev => [...prev, updatedAnime]);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addToRecommendations = async (anime: UserAnime) => {
    if (!isOwnProfile) return;
    
    try {
      await updateRecommendationStatus(anime.id, true);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding to recommendations:', error);
    }
  };

  const removeFromRecommendations = async (animeId: number) => {
    if (!isOwnProfile) return;
    
    try {
      await updateRecommendationStatus(animeId, false);
    } catch (error) {
      console.error('Error removing from recommendations:', error);
    }
  };

  const handleAnimeCardClick = (anime: UserAnime) => {
    if (onAnimeClick) {
      onAnimeClick(anime);
    }
  };

  // Efecto principal que maneja la inicialización y actualización
  useEffect(() => {
    const initializeRecommendations = async () => {
      if (!userAnimes || userAnimes.length === 0) {
        setRecommendations([]);
        setAvailableAnimes([]);
        setIsInitialized(true);
        return;
      }

      if (isOwnProfile) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/user/animes/recommend');
          if (response.ok) {
            const apiRecommendations: UserAnime[] = await response.json();
            
            const syncedRecommendations = userAnimes.filter(anime => 
              apiRecommendations.some(rec => rec.id === anime.id)
            ).map(anime => ({ ...anime, recommended: true }));
            
            setRecommendations(syncedRecommendations);
            setAvailableAnimes(userAnimes.filter(anime => 
              !syncedRecommendations.some(rec => rec.id === anime.id)
            ));
          } else {
            const currentRecommended = userAnimes.filter(anime => anime.recommended);
            setRecommendations(currentRecommended);
            setAvailableAnimes(userAnimes.filter(anime => !anime.recommended));
          }
        } catch (error) {
          console.error('Error al cargar recomendaciones:', error);
          const currentRecommended = userAnimes.filter(anime => anime.recommended);
          setRecommendations(currentRecommended);
          setAvailableAnimes(userAnimes.filter(anime => !anime.recommended));
        } finally {
          setIsLoading(false);
          setIsInitialized(true);
        }
      } else {
        if (profileUserId) {
          setIsLoading(true);
          try {
            console.log('Cargando recomendaciones para usuario ID:', profileUserId);
            const response = await fetch(`/api/user/animes/recommend?userId=${profileUserId}`);
            if (response.ok) {
              const apiRecommendations: UserAnime[] = await response.json();
              console.log('Recomendaciones de API obtenidas:', apiRecommendations.length);
              
              setRecommendations(apiRecommendations);
              setAvailableAnimes(userAnimes.filter(anime => 
                !apiRecommendations.some(rec => rec.id === anime.id)
              ));
            } else {
              console.warn('Error en API de recomendaciones, usando datos locales');
              const currentRecommended = userAnimes.filter(anime => anime.recommended);
              setRecommendations(currentRecommended);
              setAvailableAnimes(userAnimes.filter(anime => !anime.recommended));
            }
          } catch (error) {
            console.error('Error al cargar recomendaciones para perfil ajeno:', error);
            const currentRecommended = userAnimes.filter(anime => anime.recommended);
            setRecommendations(currentRecommended);
            setAvailableAnimes(userAnimes.filter(anime => !anime.recommended));
          } finally {
            setIsLoading(false);
            setIsInitialized(true);
          }
        } else {
          const currentRecommended = userAnimes.filter(anime => anime.recommended);
          setRecommendations(currentRecommended);
          setAvailableAnimes(userAnimes.filter(anime => !anime.recommended));
          setIsInitialized(true);
        }
      }
    };

    if (!isInitialized || userAnimes) {
      initializeRecommendations();
    }
  }, [userAnimes, isInitialized, isOwnProfile, profileUserId]);

  useEffect(() => {
    if (onRecommendationsChange && isInitialized) {
      onRecommendationsChange(recommendations);
    }
  }, [recommendations, onRecommendationsChange, isInitialized]);

  const getStateColor = (state: string | null | undefined) => {
    if (!state) return 'bg-gray-100 text-gray-800';
    switch (state.toLowerCase()) {
      case 'terminado': return 'bg-green-100 text-green-800';
      case 'viendo': return 'bg-blue-100 text-blue-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'abandonado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating: string | null) => {
    if (!rating) return null;
    const starCount = parseInt(rating.replace('★', ''));
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`w-3 h-3 sm:w-4 sm:h-4 ${i < starCount ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'}`}
          />
        ))}
      </div>
    );
  };

  const formatTitleWithSeason = (title: string, seasonCour: string | null | undefined) => {
    if (!seasonCour) return title;
    return `${title} ${seasonCour}`;
  };

  if (!isInitialized) {
    return (
      <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 sm:p-6 rounded-2xl mb-4 sm:mb-6 mx-1">
        <div className="flex items-center justify-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white"></div>
          <span className="ml-2 text-sm sm:text-base">Cargando recomendaciones...</span>
        </div>
      </div>
    );
  }

  if (!userAnimes || userAnimes.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 sm:p-6 rounded-2xl mb-4 sm:mb-6 mx-1">
        <div className="flex items-center mb-3 sm:mb-4">
          <StarIcon2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-yellow-300" />
          <h2 className="text-xl sm:text-2xl font-bold">
            {isOwnProfile ? 'Mis Recomendaciones' : `Recomendaciones de ${profileUsername}`}
          </h2>
        </div>
        <p className="text-blue-100 text-sm sm:text-base">
          {isOwnProfile 
            ? 'Agrega algunos animes a tu lista para crear recomendaciones'
            : `${profileUsername} aún no tiene animes en su lista`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 sm:p-6 rounded-2xl mb-4 sm:mb-6 mx-1">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="flex items-center">
          <StarIcon2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-yellow-300 flex-shrink-0" />
          <h2 className="text-xl sm:text-2xl font-bold leading-tight">
            {isOwnProfile ? 'Mis Recomendaciones' : `Recomendaciones de ${profileUsername}`}
          </h2>
        </div>
        
        {isOwnProfile && (
          <button
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
            className="
              bg-white/20 hover:bg-white/30 active:bg-white/25
              text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl 
              flex items-center justify-center sm:justify-start space-x-2 
              transition-all duration-200 ease-in-out
              shadow-md hover:shadow-lg disabled:opacity-50
              text-sm sm:text-base font-medium
              w-full sm:w-auto
              transform active:scale-95
            "
          >
            <PlusCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>Agregar Anime</span>
          </button>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-blue-100">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <StarIcon2 className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300" />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
            {isOwnProfile ? 'Sin recomendaciones aún' : `${profileUsername} no tiene recomendaciones`}
          </h3>
          <p className="text-sm sm:text-base mb-4">
            {isOwnProfile ? 'No tienes recomendaciones aún' : `${profileUsername} no tiene recomendaciones aún`}
          </p>
          {isOwnProfile && (
            <>
              <p className="text-xs sm:text-sm mb-4">¡Agrega tus animes favoritos para compartir con otros!</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="
                  bg-white/20 hover:bg-white/30 active:bg-white/25
                  text-white px-6 py-2.5 rounded-2xl font-medium
                  transition-all duration-200 ease-in-out
                  shadow-md hover:shadow-lg
                  text-sm sm:text-base
                  transform active:scale-95
                  inline-flex items-center space-x-2
                "
              >
                <PlusCircleIcon className="h-5 w-5" />
                <span>Agregar mi primera recomendación</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
          <div className="inline-flex space-x-3 sm:space-x-4 pb-2">
            {recommendations.map((anime) => (
              <div
                key={anime.id}
                onClick={() => handleAnimeCardClick(anime)}
                className="
                  inline-block w-44 sm:w-56 rounded-xl overflow-hidden flex-none 
                  transform transition-all duration-300 hover:scale-105 
                  cursor-pointer shadow-lg hover:shadow-xl
                  bg-white/95 backdrop-blur-sm
                "
              >
                <div className="relative">
                  <img
                    src={anime.imageUrl || '/default-anime.png'}
                    alt={anime.title}
                    className="w-full h-48 sm:h-64 object-cover"
                  />
                  
                  {isOwnProfile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromRecommendations(anime.id);
                      }}
                      disabled={isLoading}
                      className="
                        absolute top-2 right-2 
                        bg-red-500 hover:bg-red-600 active:bg-red-700
                        text-white rounded-full p-1.5 sm:p-2
                        transition-all duration-200 ease-in-out
                        disabled:opacity-50 shadow-md hover:shadow-lg
                        transform active:scale-90
                      "
                    >
                      <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                  
                  <div className={`
                    absolute top-2 left-2 px-2 py-1 rounded-full 
                    text-xs font-semibold shadow-sm
                    ${getStateColor(anime.state)}
                  `}>
                    {anime.state}
                  </div>
                </div>
                
                <div className="p-3 sm:p-4 bg-white/90 backdrop-blur-sm">
                  <div className="mb-2">
                    {getRatingStars(anime.rating)}
                  </div>
                  
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base leading-tight mb-1 line-clamp-2">
                    {formatTitleWithSeason(anime.title, '')}
                  </h3>
                  
                  <h4 className="font-medium text-gray-600 text-xs sm:text-sm mb-2 truncate">
                    {anime.seasonCour} temporada
                  </h4>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-1">
                    <span className="truncate">{anime.season} • {anime.year}</span>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-gray-600">
                    Cap. {anime.currentEpisode || 0} / {anime.totalChapters || '??'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal optimizado para móvil */}
      {isOwnProfile && showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-xl">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Agregar a Recomendaciones
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="
                  text-gray-500 hover:text-red-600 active:text-red-700
                  transition-colors duration-200 p-2 rounded-full 
                  hover:bg-gray-100 active:bg-gray-200
                  transform active:scale-90
                "
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="relative text-gray-700">
                <input
                  type="text"
                  placeholder="Buscar anime..."
                  className="
                    w-full pl-4 sm:pl-5 pr-10 sm:pr-12 py-2.5 sm:py-3
                    border-2 border-gray-200 rounded-2xl 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 
                    focus:border-transparent 
                    transition-all duration-300 
                    shadow-sm hover:shadow-md
                    text-sm sm:text-base
                  "
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const filtered = userAnimes.filter(anime =>
                      !recommendations.some(rec => rec.id === anime.id) &&
                      anime.title.toLowerCase().includes(searchTerm)
                    );
                    setAvailableAnimes(filtered);
                  }}
                />
                <MagnifyingGlassIcon className="
                  absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 
                  h-5 w-5 sm:h-6 sm:w-6 text-gray-400 pointer-events-none
                " />
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-96 overflow-y-auto">
              {availableAnimes.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium mb-2">No se encontraron animes</h4>
                  <p className="text-sm">No hay animes disponibles para agregar a recomendaciones</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {availableAnimes.map((anime) => (
                    <div
                      key={anime.id}
                      onClick={() => addToRecommendations(anime)}
                      className="
                        bg-gray-50 rounded-xl overflow-hidden cursor-pointer 
                        transform transition-all duration-200 
                        hover:scale-105 hover:shadow-lg active:scale-95
                        border border-gray-200 hover:border-gray-300
                      "
                    >
                      <img
                        src={anime.imageUrl || '/default-anime.png'}
                        alt={anime.title}
                        className="w-full h-24 sm:h-32 object-cover"
                      />
                      <div className="p-2 sm:p-3">
                        <h4 className="
                          font-semibold text-gray-800 text-xs sm:text-sm 
                          truncate mb-1 leading-tight
                        ">
                          {formatTitleWithSeason(anime.title, '')}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className={`
                            px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full 
                            text-xs font-semibold ${getStateColor(anime.state)}
                          `}>
                            {anime.state}
                          </span>
                          <div className="scale-75 sm:scale-100">
                            {getRatingStars(anime.rating)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS para ocultar scrollbar en móvil */}
      
    </div>
  );
};

export default RecommendationsBanner;