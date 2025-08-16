// hooks/useViewState.ts
import { useState } from 'react';
import { AnimeDrive, SeasonData } from '../types/anime';

export const useViewState = () => {
  const [viewState, setViewState] = useState<'drive' | 'season' | 'anime'>('drive');
  const [selectedSeason, setSelectedSeason] = useState<SeasonData['seasons'][0] | null>(null);
  const [selectedAnime, setSelectedAnime] = useState<AnimeDrive | null>(null);
  const [cameFromSearch, setCameFromSearch] = useState(false);
  const [cameFromRecommendations, setCameFromRecommendations] = useState(false);

  const resetViewState = () => {
    setViewState('drive');
    setSelectedSeason(null);
    setSelectedAnime(null);
    setCameFromSearch(false);
    setCameFromRecommendations(false);
  };

  return {
    viewState,
    setViewState,
    selectedSeason,
    setSelectedSeason,
    selectedAnime,
    setSelectedAnime,
    cameFromSearch,
    setCameFromSearch,
    cameFromRecommendations,
    setCameFromRecommendations,
    resetViewState
  };
};
