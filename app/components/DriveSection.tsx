// components/DriveSection.tsx
import DriveCalendar from './DriveCalendar';
import { SeasonData, AnimeDrive } from '../types/anime';

interface DriveSectionProps {
  isOwnProfile: boolean;
  profileUsername: string;
  driveData: SeasonData[];
  onSeasonClick: (seasonData: SeasonData['seasons'][0]) => void;
  onAnimeClick: (animeData: AnimeDrive) => void;
  viewState: 'drive' | 'season' | 'anime';
  selectedSeason: SeasonData['seasons'][0] | null;
  selectedAnime: AnimeDrive | null;
}

export const DriveSection = ({
  isOwnProfile,
  profileUsername,
  driveData,
  onSeasonClick,
  onAnimeClick,
  viewState,
  selectedSeason,
  selectedAnime
}: DriveSectionProps) => {
  return (
    <section>
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">
        {isOwnProfile ? 'Tu Drive' : `Drive de ${profileUsername}`}
      </h2>
      {driveData.length > 0 ? (
        <DriveCalendar
          data={driveData}
          onSeasonClick={onSeasonClick}
          onAnimeClick={onAnimeClick}
          viewState={viewState}
          selectedSeason={selectedSeason}
          selectedAnime={selectedAnime}
        />
      ) : (
        <p className="text-gray-600">
          {isOwnProfile 
            ? 'Aún no tienes animes en tu Drive.' 
            : `${profileUsername} aún no tiene animes en su Drive.`
          }
        </p>
      )}
    </section>
  );
};