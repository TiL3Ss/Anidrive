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
    <section className="mb-8 sm:mb-10 lg:mb-12">
      {/* Header con título y botones */}
      <div className="mb-4 sm:mb-6">
        {/* Título */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-700 mb-4 sm:mb-6 px-1">
          {isOwnProfile ? 'Viendo Actualmente' : `${profileUsername} está viendo`}
        </h2>
        
        {/* Botones - Layout responsivo */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 px-1">
          {/* Botón Añadir Anime - Solo para perfil propio */}
          {isOwnProfile && (
            <button
              onClick={onAddAnimeClick}
              className="
                cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white 
                px-4 sm:px-6 py-2.5 sm:py-2 rounded-2xl font-semibold 
                hover:from-blue-600 hover:to-blue-700 
                active:scale-[0.98] transform
                transition-all duration-200 ease-in-out
                flex items-center justify-center sm:justify-start
                shadow-md hover:shadow-lg
                text-sm sm:text-base
                order-1 sm:order-1
              "
            >
              <PlusCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="truncate">Añadir Anime</span>
            </button>
          )}
          
          {/* Botón Buscar */}
          <button
            onClick={onSearchClick}
            className="
              cursor-pointer bg-gradient-to-r from-orange-400 to-orange-500 text-white 
              px-4 sm:px-6 py-2.5 sm:py-2 rounded-2xl font-semibold 
              hover:from-orange-500 hover:to-orange-600 
              active:scale-[0.98] transform
              transition-all duration-200 ease-in-out
              flex items-center justify-center sm:justify-start
              shadow-md hover:shadow-lg
              text-sm sm:text-base
              order-2 sm:order-2
            "
          >
            <MagnifyingGlassIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="truncate">
              {isOwnProfile ? 'Buscar' : `Buscar en Drive`}
            </span>
          </button>
        </div>
      </div>
      
      {/* Contenido del carrusel o mensaje vacío */}
      <div className="px-1">
        {animesWatching.length > 0 ? (
          <AnimeCarousel 
            animes={animesWatching}
            onAnimeClick={onAnimeClick}
          />
        ) : (
          <div className="
            bg-white/80 backdrop-blur-sm 
            border border-gray-200/60 
            rounded-2xl p-6 sm:p-8 
            text-center
            shadow-sm
          ">
            <div className="
              w-16 h-16 sm:w-20 sm:h-20 
              bg-gray-100 rounded-full 
              flex items-center justify-center 
              mx-auto mb-4
            ">
              <svg 
                className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM9 3v1h6V3H9zm0 5v8h6V8H9z" 
                />
              </svg>
            </div>
            
            <h3 className="
              text-lg sm:text-xl font-medium text-gray-700 
              mb-2 sm:mb-3
            ">
              {isOwnProfile ? 'No hay animes en progreso' : 'Sin animes activos'}
            </h3>
            
            <p className="
              text-sm sm:text-base text-gray-500 
              max-w-md mx-auto leading-relaxed
            ">
              {isOwnProfile 
                ? 'Añade tu primer anime para comenzar a hacer seguimiento de tu progreso.' 
                : `${profileUsername} no está viendo ningún anime actualmente.`
              }
            </p>
            
            {/* Botón de acción en estado vacío - Solo para perfil propio */}
            {isOwnProfile && (
              <button
                onClick={onAddAnimeClick}
                className="
                  mt-4 sm:mt-6 
                  bg-gradient-to-r from-blue-500 to-blue-600 text-white 
                  px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl font-semibold 
                  hover:from-blue-600 hover:to-blue-700 
                  active:scale-[0.98] transform
                  transition-all duration-200 ease-in-out
                  shadow-md hover:shadow-lg
                  text-sm sm:text-base
                  inline-flex items-center
                "
              >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Añadir mi primer anime
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};