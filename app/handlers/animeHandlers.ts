// handlers/animeHandlers.ts
import { AnimeDrive } from '../types/anime';

interface UseAnimeHandlersProps {
  isOwnProfile: boolean;
  fetchAnimesData: () => Promise<void>;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  setViewState: (state: 'drive' | 'season' | 'anime') => void;
  setSelectedAnime: (anime: AnimeDrive | null) => void;
  setCameFromSearch: (value: boolean) => void;
  setCameFromRecommendations: (value: boolean) => void;
  closeAllModals: () => void;
  getSeasonColor: (seasonName: string | null) => string;
}

export const useAnimeHandlers = ({
  isOwnProfile,
  fetchAnimesData,
  showNotification,
  setViewState,
  setSelectedAnime,
  setCameFromSearch,
  setCameFromRecommendations,
  closeAllModals,
  getSeasonColor
}: UseAnimeHandlersProps) => {

  const handleAddAnimeSuccess = (message: string) => {
    closeAllModals();
    showNotification(message, 'success');
    fetchAnimesData();
  };

  const handleAddAnimeError = (message: string) => {
    showNotification(message, 'error');
  };

  const handleEditAnimeSuccess = (message: string) => {
    showNotification(message, 'success');
    closeAllModals();
    fetchAnimesData();
    setTimeout(() => {
      setViewState('drive');
      setSelectedAnime(null);
      setCameFromSearch(false);
      setCameFromRecommendations(false);
    });
  };

  const handleEditAnimeError = (message: string) => {
    showNotification(message, 'error');
  };

  const handleDeleteAnime = async (animeId: number) => {
    if (!isOwnProfile) {
      showNotification('No tienes permisos para eliminar este anime', 'error');
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

      showNotification('Anime eliminado correctamente', 'success');
      closeAllModals();
      fetchAnimesData();
      setViewState('drive');
      setSelectedAnime(null);
    } catch (error) {
      console.error('Error deleting anime:', error);
      showNotification('Error al eliminar el anime', 'error');
    }
  };

  const handleRecommendationClick = (userAnime: any) => {
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

  const handleSearchAnimeSelect = (anime: any) => {
  // Convertir el anime de la búsqueda al formato esperado
  const formattedAnime: AnimeDrive = {
    id: anime.id,
    title: anime.name,
    imageUrl: anime.image_url || '',
    currentEpisode: anime.current_chapter || 0,
    totalChapters: anime.total_chapters || 0,
    state_name: anime.state_name,
    rating: anime.rating_value ? anime.rating_value.split('/')[0] : null, // Mantener como string
    year: anime.year,
    seasonName: anime.season_name || '???',
    seasonCour: anime.season || '???', // Usar el campo season si está disponible
    recommended: 'false', // Como string según la interfaz
    seasonColor: getSeasonColor(anime.season_name), // Obtener el color de la temporada
    review: null
  };

  setSelectedAnime(formattedAnime);
  setCameFromSearch(true);
  setCameFromRecommendations(false);
  setViewState('anime');
  closeAllModals();
};

  const handleWatchingAnimeClick = (watchingAnime: any, findAnimeInDriveData: (id: number) => AnimeDrive | null) => {
    const fullAnimeData = findAnimeInDriveData(watchingAnime.id);
    
    if (fullAnimeData) {
      setSelectedAnime(fullAnimeData);
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
    }
    
    setCameFromSearch(true);
    setViewState('anime');
  };

  return {
    handleAddAnimeSuccess,
    handleAddAnimeError,
    handleEditAnimeSuccess,
    handleEditAnimeError,
    handleDeleteAnime,
    handleRecommendationClick,
    handleSearchAnimeSelect,
    handleWatchingAnimeClick
  };
};

// types/anime.ts
export interface AnimeWatching {
  id: number;
  title: string;
  imageUrl: string | null;
  currentEpisode: number | null;
  totalChapters: number | null;
}

export interface AnimeDrive {
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

export interface SeasonData {
  year: number;
  seasons: {
    name: string | null;
    color: string;
    animes: AnimeDrive[];
  }[];
}

export interface UserAnime {
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

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  tag: string;
  created_at: string;
  animeCount: number;
  isOwnProfile: boolean;
}