// components/AnimeCarousel.tsx
import React from 'react';

interface AnimeWatching {
  id: number;
  title: string;
  imageUrl: string | null;
  currentEpisode: number | null;
  totalChapters: number | null;
}

interface AnimeCarouselProps {
  animes: AnimeWatching[];
  onAnimeClick?: (anime: AnimeWatching) => void; 
}

const AnimeCarousel: React.FC<AnimeCarouselProps> = ({ animes, onAnimeClick }) => {
  if (!animes || animes.length === 0) {
    return null; // O un mensaje de "No hay animes para mostrar"
  }

  const handleAnimeClick = (anime: AnimeWatching) => {
    if (onAnimeClick) {
      onAnimeClick(anime);
    }
  };

  return (
    <div className="relative w-full">
      <div className="overflow-x-auto whitespace-nowrap scroll-smooth py-4"> {/* Contenedor con scroll horizontal */}
        <div className="inline-flex space-x-4 px-2"> {/* Contenedor flex para los ítems */}
          {animes.map((anime) => ( // Mapea directamente los animes recibidos
            <div
              key={anime.id} // Es crucial usar una key única aquí
              onClick={() => handleAnimeClick(anime)}
              className="inline-block w-48 bg-white rounded-lg shadow-md overflow-hidden flex-none transform transition-transform duration-300 hover:scale-105 cursor-pointer hover:shadow-lg"
            >
              <img
                src={anime.imageUrl || '/default-anime.png'} // Usa una imagen por defecto si no hay
                alt={anime.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">{anime.title}</h3>
                <p className="text-sm text-gray-600">
                  Cap. {anime.currentEpisode || 0} / {anime.totalChapters || '??'}
                </p>
                {/* Puedes añadir más detalles aquí si quieres */}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Opcional: Aquí puedes añadir botones de navegación izquierda/derecha para el carrusel */}
    </div>
  );
};

export default AnimeCarousel;