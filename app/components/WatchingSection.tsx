// components/WatchingSection.tsx
import { PlusCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AnimeCarousel from './AnimeCarousel';
import { AnimeWatching } from '../types/anime';

interface WatchingSectionProps {
  isOwnProfile: boolean;
  profileUsername: string;
  animesWatching: AnimeWatching[];
  onAnimeClick: (anime: AnimeWatching) => void;
  onAddAnimeClick: () => void;
  onSearchClick: () => void;
}

export const WatchingSection = ({
  isOwnProfile,
  profileUsername,
  animesWatching,
  onAnimeClick,
  onAddAnimeClick,
  onSearchClick
}: WatchingSectionProps) => {
  return (
    <section className="mb-12">
      <div className="flex items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-700">
          {isOwnProfile ? 'Viendo Actualmente' : `${profileUsername} está viendo`}
        </h2>
        
        <div className="flex items-center ml-4">
          {/* Botón Añadir Anime - Solo para perfil propio */}
          {isOwnProfile && (
            <button
              onClick={onAddAnimeClick}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition duration-300 flex items-center mr-4"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Añadir Anime
            </button>
          )}
          
          {/* Botón Buscar */}
          <button
            onClick={onSearchClick}
            className="bg-orange-400 text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-700 transition duration-300 flex items-center"
          >
            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
            {isOwnProfile ? 'Buscar' : `Buscar en Drive de ${profileUsername}`}
          </button>
        </div>
      </div>
      
      {animesWatching.length > 0 ? (
        <AnimeCarousel 
          animes={animesWatching}
          onAnimeClick={onAnimeClick}
        />
      ) : (
        <p className="text-gray-600">
          {isOwnProfile 
            ? 'No estás viendo ningún anime actualmente.' 
            : `${profileUsername} no está viendo ningún anime actualmente.`
          }
        </p>
      )}
    </section>
  );
};