// app/profile/[username]/page.tsx
'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import { useSession, signOut } from 'next-auth/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Components
import Header from '../../components/Header';
import RecommendationsBanner from '../../components/RecommendationsBanner';
import DriveCalendar from '../../components/DriveCalendar';
import AddAnimeModal from '../../components/AddAnimeModal';
import NotificationToast from '../../components/NotificationToast';
import EditAnimeModal from '../../components/EditAnimeModal';
import DELAnimeModal from '../../components/DelAnimeModal';
import AnimeMain from '../../components/AnimeMain';
import AnimeSearchModal from '../../components/SearchAnimeModal';

// Refactored Components
import { ProfileHeader } from '../../components/ProfileHeader';
import { ProfileLoadingState } from '../../components/ProfileLoadingState';
import { ProfileNotFound } from '../../components/ProfileNotFound';
import { WatchingSection } from '../../components/WatchingSection';
import { DriveSection } from '../../components/DriveSection';

// Custom Hooks
import { useProfile } from '../../hooks/useProfile';
import { useAnimeData } from '../../hooks/useAnimeData';
import { useModals } from '../../hooks/useModals';
import { useViewState } from '../../hooks/useViewState';
import { useNotifications } from '../../hooks/useNotifications';
import { useAnimeHandlers } from '../../handlers/animeHandlers';

// Types
import { UserAnime } from '../../types/anime';

export default function DynamicProfilePage() {
  const { data: session } = useSession();
  
  // Custom hooks
  const {
    profileUser,
    isOwnProfile,
    profileNotFound,
    isLoading: profileLoading,
    currentUsername
  } = useProfile();

  const {
    animesWatching,
    driveData,
    isLoading: animeLoading,
    fetchAnimesData,
    findAnimeInDriveData,
    getSeasonColor
  } = useAnimeData(profileUser?.id || null);

  const {
    showAddAnimeModal,
    setShowAddAnimeModal,
    showEditAnimeModal,
    setShowEditAnimeModal,
    showDelAnimeModal,
    setShowDelAnimeModal,
    showSearchAnimeModal,
    setShowSearchAnimeModal,
    closeAllModals
  } = useModals();

  const {
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
  } = useViewState();

  const {
    notification,
    showNotification,
    clearNotification
  } = useNotifications();

  // Anime handlers
  const {
    handleAddAnimeSuccess,
    handleAddAnimeError,
    handleEditAnimeSuccess,
    handleEditAnimeError,
    handleDeleteAnime,
    handleRecommendationClick,
    handleSearchAnimeSelect,
    handleWatchingAnimeClick
  } = useAnimeHandlers({
    isOwnProfile,
    fetchAnimesData,
    showNotification,
    setViewState,
    setSelectedAnime,
    setCameFromSearch,
    setCameFromRecommendations,
    closeAllModals,
    getSeasonColor
  });

  // Update selected anime when drive data changes
  useEffect(() => {
    if (selectedAnime && driveData.length > 0) {
      const updatedAnime = findAnimeInDriveData(selectedAnime.id);
      if (updatedAnime && JSON.stringify(updatedAnime) !== JSON.stringify(selectedAnime)) {
        setSelectedAnime(updatedAnime);
      }
    }
  }, [driveData, selectedAnime, findAnimeInDriveData, setSelectedAnime]);

  // Create user animes list for recommendations
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

  // Event handlers
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleBackNavigation = () => {
    if (cameFromSearch || cameFromRecommendations) {
      setViewState('drive');
      setCameFromSearch(false);
      setCameFromRecommendations(false);
    } else {
      setViewState('season');
    }
    setSelectedAnime(null);
  };

  // Loading state
  if (profileLoading || animeLoading) {
    return (
      <ProfileLoadingState
        isLoggedIn={true}
        onLogout={handleLogout}
        username={currentUsername}
      />
    );
  }

  // Profile not found state
  if (profileNotFound) {
    return (
      <ProfileNotFound
        isLoggedIn={true}
        onLogout={handleLogout}
        username={currentUsername}
        usernameParam={profileUser?.username || ''}
      />
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
        isLoggedIn={true}
        onLogout={handleLogout}
        username={currentUsername}
      />
      
      <main className="flex-grow">
        <ProfileHeader
          isOwnProfile={isOwnProfile}
          currentUsername={currentUsername}
          profileUsername={profileUser.username}
          userImage={session?.user?.image}
        />
        
        <div className="container mx-auto px-4 py-8 pt-24 bg-gray-50">
          {viewState === 'drive' && (
            <>
              <RecommendationsBanner 
                userAnimes={allUserAnimes} 
                onAnimeClick={handleRecommendationClick}
                isOwnProfile={isOwnProfile}
                profileUsername={profileUser.username}
                profileUserId={profileUser.id}
              />
              
              <WatchingSection
                isOwnProfile={isOwnProfile}
                profileUsername={profileUser.username}
                animesWatching={animesWatching}
                onAnimeClick={(anime) => handleWatchingAnimeClick(anime, findAnimeInDriveData)}
                onAddAnimeClick={() => setShowAddAnimeModal(true)}
                onSearchClick={() => setShowSearchAnimeModal(true)}
              />

              <DriveSection
                isOwnProfile={isOwnProfile}
                profileUsername={profileUser.username}
                driveData={driveData}
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
              onBack={handleBackNavigation}
              onEdit={() => isOwnProfile && setShowEditAnimeModal(true)}
              onDelete={() => isOwnProfile && setShowDelAnimeModal(true)}
              onReviewUpdate={(newReview) => {
                setSelectedAnime(prev => prev ? { ...prev, review: newReview } : null);
              }}
              username={profileUser.username}
              backToSeason={!cameFromSearch && !cameFromRecommendations}
              isOwnProfile={isOwnProfile}
              profileUserId={profileUser.id}
            />
          )}

          {/* Modals - Only shown if it's own profile */}
          {showSearchAnimeModal && (
  <AnimeSearchModal 
    isOpen={showSearchAnimeModal}
    onClose={() => setShowSearchAnimeModal(false)}
    onAnimeSelect={handleSearchAnimeSelect}
    isOwnProfile={isOwnProfile}
    profileUserId={profileUser.id}
    profileUsername={profileUser.username}
  />
)}

  {/* Modals - Solo para perfil propio */}
  {isOwnProfile && (
    <>
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
          onClose={clearNotification}
        />
      )}
    </div>
  );
}