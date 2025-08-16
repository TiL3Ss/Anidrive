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
  isOwnProfile?: boolean; // Nueva prop para determinar si es el propio perfil
  profileUsername?: string; // Nueva prop para mostrar el nombre del usuario
  profileUserId?: number; // Nueva prop para el ID del usuario del perfil
}

const RecommendationsBanner: React.FC<RecommendationsBannerProps> = ({
  userAnimes,
  onRecommendationsChange,
  onAnimeClick,
  isOwnProfile = true, // Por defecto true para mantener compatibilidad
  profileUsername = 'Usuario', // Por defecto 'Usuario'
  profileUserId // ID del usuario del perfil visitado
}) => {
  const [recommendations, setRecommendations] = useState<UserAnime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableAnimes, setAvailableAnimes] = useState<UserAnime[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const updateRecommendationStatus = async (animeId: number, recommended: boolean) => {
    // Solo permitir modificaciones si es el propio perfil
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

  // Función para manejar el click en las tarjetas
  const handleAnimeCardClick = (anime: UserAnime) => {
    if (onAnimeClick) {
      onAnimeClick(anime);
    }
  };

  // Efecto principal que maneja la inicialización y actualización
  useEffect(() => {
    const initializeRecommendations = async () => {
      // Si no hay userAnimes aún, no hacer nada
      if (!userAnimes || userAnimes.length === 0) {
        setRecommendations([]);
        setAvailableAnimes([]);
        setIsInitialized(true);
        return;
      }

      // Si es el propio perfil, intentamos sincronizar con la API
      if (isOwnProfile) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/user/animes/recommend');
          if (response.ok) {
            const apiRecommendations: UserAnime[] = await response.json();
            
            // Sincronizar con userAnimes para asegurar consistencia
            const syncedRecommendations = userAnimes.filter(anime => 
              apiRecommendations.some(rec => rec.id === anime.id)
            ).map(anime => ({ ...anime, recommended: true }));
            
            setRecommendations(syncedRecommendations);
            setAvailableAnimes(userAnimes.filter(anime => 
              !syncedRecommendations.some(rec => rec.id === anime.id)
            ));
          } else {
            // Si falla la API, usar los datos de userAnimes
            const currentRecommended = userAnimes.filter(anime => anime.recommended);
            setRecommendations(currentRecommended);
            setAvailableAnimes(userAnimes.filter(anime => !anime.recommended));
          }
        } catch (error) {
          console.error('Error al cargar recomendaciones:', error);
          // Fallback a userAnimes si hay error en la API
          const currentRecommended = userAnimes.filter(anime => anime.recommended);
          setRecommendations(currentRecommended);
          setAvailableAnimes(userAnimes.filter(anime => !anime.recommended));
        } finally {
          setIsLoading(false);
          setIsInitialized(true);
        }
      } else {
        // Si NO es el propio perfil, usar la API con el userId del perfil visitado
        if (profileUserId) {
          setIsLoading(true);
          try {
            console.log('Cargando recomendaciones para usuario ID:', profileUserId);
            const response = await fetch(`/api/user/animes/recommend?userId=${profileUserId}`);
            if (response.ok) {
              const apiRecommendations: UserAnime[] = await response.json();
              console.log('Recomendaciones de API obtenidas:', apiRecommendations.length);
              
              // Usar directamente los datos de la API para perfiles ajenos
              setRecommendations(apiRecommendations);
              setAvailableAnimes(userAnimes.filter(anime => 
                !apiRecommendations.some(rec => rec.id === anime.id)
              ));
            } else {
              console.warn('Error en API de recomendaciones, usando datos locales');
              // Fallback a userAnimes si falla la API
              const currentRecommended = userAnimes.filter(anime => anime.recommended);
              setRecommendations(currentRecommended);
              setAvailableAnimes(userAnimes.filter(anime => !anime.recommended));
            }
          } catch (error) {
            console.error('Error al cargar recomendaciones para perfil ajeno:', error);
            // Fallback a userAnimes si hay error en la API
            const currentRecommended = userAnimes.filter(anime => anime.recommended);
            setRecommendations(currentRecommended);
            setAvailableAnimes(userAnimes.filter(anime => !anime.recommended));
          } finally {
            setIsLoading(false);
            setIsInitialized(true);
          }
        } else {
          // Si no hay profileUserId, usar solo los datos de userAnimes
          const currentRecommended = userAnimes.filter(anime => anime.recommended);
          setRecommendations(currentRecommended);
          setAvailableAnimes(userAnimes.filter(anime => !anime.recommended));
          setIsInitialized(true);
        }
      }
    };

    // Solo inicializar si no se ha hecho antes o si userAnimes cambia significativamente
    if (!isInitialized || userAnimes) {
      initializeRecommendations();
    }
  }, [userAnimes, isInitialized, isOwnProfile, profileUserId]);

  // Efecto para notificar cambios a componente padre
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
            className={`w-4 h-4 ${i < starCount ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'}`}
          />
        ))}
      </div>
    );
  };

  const formatTitleWithSeason = (title: string, seasonCour: string | null | undefined) => {
    if (!seasonCour) return title;
    return `${title} ${seasonCour}`;
  };

  // Mostrar loading mientras se inicializa
  if (!isInitialized) {
    return (
      <div className="bg-gradient-to-r from-blue-300 to-blue-500 text-white p-6 rounded-lg mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-2">Cargando recomendaciones...</span>
        </div>
      </div>
    );
  }

  if (!userAnimes || userAnimes.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-300 to-blue-500 text-white p-6 rounded-lg mb-6">
        <StarIcon2 className="h-5 w-5" />
        <h2 className="text-2xl font-bold mb-2">
          {isOwnProfile ? 'Mis Recomendaciones' : `Recomendaciones de ${profileUsername}`}
        </h2>
        <p className="text-purple-100">
          {isOwnProfile 
            ? 'Agrega algunos animes a tu lista para crear recomendaciones'
            : `${profileUsername} aún no tiene animes en su lista`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-300 to-blue-500 text-white p-6 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <StarIcon2 className="h-5 w-5 mr-2 text-yellow-400" />
          <h2 className="text-2xl font-bold">
            {isOwnProfile ? 'Mis Recomendaciones' : `Recomendaciones de ${profileUsername}`}
          </h2>
        </div>
        
        {/* Solo mostrar el botón de agregar si es el propio perfil */}
        {isOwnProfile && (
          <button
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full flex items-center space-x-2 transition-colors shadow-md disabled:opacity-50"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            <span>Agregar Anime</span>
          </button>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-blue-100">
          <p className="mb-2">
            {isOwnProfile ? 'No tienes recomendaciones aún' : `${profileUsername} no tiene recomendaciones aún`}
          </p>
          {isOwnProfile && (
            <p className="text-sm">¡Agrega tus animes favoritos para compartir con otros!</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto whitespace-nowrap scroll-smooth">
          <div className="inline-flex space-x-4">
            {recommendations.map((anime) => (
              <div
                key={anime.id}
                onClick={() => handleAnimeCardClick(anime)}
                className="inline-block w-56 rounded-lg overflow-hidden flex-none transform transition-transform duration-300 hover:scale-105 cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={anime.imageUrl || '/default-anime.png'}
                    alt={anime.title}
                    className="w-full h-64 object-cover"
                  />
                  
                  {/* Solo mostrar el botón de eliminar si es el propio perfil */}
                  {isOwnProfile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevenir que se active el click de la card
                        removeFromRecommendations(anime.id);
                      }}
                      disabled={isLoading}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors disabled:opacity-50"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                  
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${getStateColor(anime.state)}`}>
                    {anime.state}
                  </div>
                </div>
                <div className="p-4 bg-white/40 rounded-b-lg">
                  {getRatingStars(anime.rating)}
                  <h2 className="font-semibold truncate text-gray-700">
                    {formatTitleWithSeason(anime.title, '')} 
                  </h2>
                  <h3 className="font-semibold truncate mb-1 text-gray-700">{anime.seasonCour} temporada</h3>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span>{anime.season} • {anime.year}</span>
                  </div>
                  <p className="text-sm mt-1 text-gray-700">
                    Cap. {anime.currentEpisode || 0} / {anime.totalChapters || '??'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para agregar animes - Solo se muestra si es el propio perfil */}
      {isOwnProfile && showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Agregar a Recomendaciones</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="px-6 py-4 border-b">
              <div className="relative text-gray-700">
                <input
                  type="text"
                  placeholder="Buscar anime..."
                  className="w-full pl-5 pr-10 py-2.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner peer"
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const filtered = userAnimes.filter(anime =>
                      !recommendations.some(rec => rec.id === anime.id) &&
                      anime.title.toLowerCase().includes(searchTerm)
                    );
                    setAvailableAnimes(filtered);
                  }}
                />
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none peer-focus:text-blue-500 transition-colors duration-300" />
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {availableAnimes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron animes disponibles para agregar</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableAnimes.map((anime) => (
                    <div
                      key={anime.id}
                      onClick={() => addToRecommendations(anime)}
                      className="bg-gray-50 rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105 hover:shadow-md"
                    >
                      <img
                        src={anime.imageUrl || '/default-anime.png'}
                        alt={anime.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="font-semibold text-gray-800 text-sm truncate mb-1">
                          {formatTitleWithSeason(anime.title, '')}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStateColor(anime.state)}`}>
                            {anime.state}
                          </span>
                          {getRatingStars(anime.rating)}
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
    </div>
  );
};

export default RecommendationsBanner;