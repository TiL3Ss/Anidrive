// hooks/useAnimeData.ts
import { useState, useEffect } from 'react';
import { AnimeWatching, AnimeDrive, SeasonData } from '../types/anime';

const getSeasonColor = (seasonName: string | null): string => {
  switch (seasonName?.toLowerCase()) {
    case 'invierno': return 'bg-blue-500';
    case 'primavera': return 'bg-green-600';
    case 'verano': return 'bg-yellow-400';
    case 'otoño': return 'bg-orange-600';
    default: return 'bg-gray-200';
  }
};

export const useAnimeData = (profileUserId: number | null) => {
  const [animesWatching, setAnimesWatching] = useState<AnimeWatching[]>([]);
  const [driveData, setDriveData] = useState<SeasonData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnimesData = async () => {
    if (!profileUserId) {
      console.warn('No hay profileUserId, no se pueden cargar datos de anime');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Obteniendo datos de anime para usuario ID:', profileUserId);

      // --- FETCH PARA ANIMES VIENDO ---
      const watchingResponse = await fetch(`/api/animes?userId=${profileUserId}&state=viendo`);

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

      // --- FETCH PARA DRIVE DATA ---
      const driveResponse = await fetch(`/api/animes?userId=${profileUserId}`);

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
          seasonColor,
        });
        return acc;
      }, [] as SeasonData[]);

      // Ordenar por año descendente
      groupedDriveData.sort((a, b) => b.year - a.year);
      setDriveData(groupedDriveData);

      console.log('Drive data procesado:', groupedDriveData.length, 'años');

    } catch (error) {
      console.error('Error general al obtener datos de anime:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profileUserId) {
      fetchAnimesData();
    }
  }, [profileUserId]);

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

  return {
    animesWatching,
    driveData,
    isLoading,
    fetchAnimesData,
    findAnimeInDriveData,
    getSeasonColor
  };
};