// components/DriveCalendar.js
'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const seasonColors = {
  'Invierno': 'bg-blue-500',
  'Primavera': 'bg-green-600',
  'Verano': 'bg-red-400',
  'Otoño': 'bg-yellow-600',
};

const getSeasonColorForBubble = (seasonName) => {
    return seasonColors[seasonName] || 'bg-gray-400';
};

const AnimeBubble = ({ anime, onClick, isFocused }) => {
  const shortTitle = anime.title.length > 20 ? `${anime.title.substring(0, 20)}...` : anime.title;
  
  const bubbleClasses = `
    relative flex flex-col items-center justify-center overflow-visible
    ${isFocused ? `
      w-80 h-80 rounded-[2.8rem]
      bg-white shadow-2xl
      border-[6px] border-blue-400/90
      transform scale-110
      transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
    ` : `
      w-52 h-52 rounded-[2.2rem]
      bg-white shadow-xl
      cursor-pointer hover:shadow-2xl
      transition-all duration-300 ease-out
      hover:scale-[1.03]
    `}
  `;

  return (
    <div className={bubbleClasses} onClick={() => onClick(anime)}>
      {/* Contenedor de imagen ajustado al borde */}
      <div className={`relative ${isFocused ? 'w-[88%] h-[88%] mt-1' : 'w-[90%] h-[90%] mt-1'} overflow-hidden rounded-[1.8rem]`}>
        <Image
          src={anime.imageUrl}
          alt={anime.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Badge de rating (izquierda superior) */}
      <div className="absolute -top-3 -left-2 w-12 h-12 rounded-full bg-yellow-300 flex items-center justify-center text-sm font-bold text-gray-800 shadow-lg border-2 border-yellow-400/80 z-10">
        {anime.rating || 'N/A'}
      </div>

      {/* Badge de temporada/cour (derecha superior) */}
      {anime.seasonCour && (
        <div className="absolute -top-3 -right-2 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-blue-400/80 z-10">
          {anime.seasonCour}
        </div>
      )}

      {/* Badge de episodios (debajo del badge de temporada) */}
      <div className="absolute top-8 -right-2 w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-gray-600/80 z-10">
        {anime.currentEpisode || 0}/{anime.totalChapters || '??'}
      </div>

      {/* Nombre del anime (desbordando abajo) */}
      <div className={`
        absolute -bottom-4
        bg-gradient-to-r from-gray-800 to-gray-700
        text-white text-sm font-medium text-center py-2 px-5
        rounded-full shadow-lg border border-gray-600/50 z-10
        ${isFocused ? 'min-w-[70%]' : 'min-w-[65%]'}
      `}>
        {shortTitle}
      </div>

      {/* Efecto de brillo cuando está enfocado */}
      {isFocused && (
        <div className="absolute inset-0 rounded-[2.8rem] pointer-events-none mix-blend-overlay bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,transparent_70%)]" />
      )}
    </div>
  );
};


export default function DriveCalendar({ data, onSeasonClick, onAnimeClick, viewState, selectedSeason, selectedAnime }) {
  const [currentYearFocus, setCurrentYearFocus] = useState(null);

  useEffect(() => {
    if (selectedSeason) {
      setCurrentYearFocus(selectedSeason.year);
    } else if (viewState === 'drive') {
      setCurrentYearFocus(null); // Reset focus when back to main drive
    }
  }, [selectedSeason, viewState]);

  const renderSeasonBlock = (season, year) => (
    <div
      key={`${year}-${season.name}`}
      className={`${season.color} p-4 rounded-[2rem] shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center min-h-[150px]`}
      onClick={() => onSeasonClick({ ...season, year })}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-2">{season.name}</h3>
      <div className="flex flex-wrap justify-center gap-2">
        {season.animes.slice(0, 3).map((anime) => (
          <div key={anime.id} className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
            <Image src={anime.imageUrl} alt={anime.title} width={64} height={64} className="object-cover" />
          </div>
        ))}
        {season.animes.length > 3 && (
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-gray-700">
            ...
          </div>
        )}
      </div>
    </div>
  );

  const getAdjacentSeasons = (yearData, currentSeasonName) => {
    const seasonsInYear = yearData.seasons;
    const currentIndex = seasonsInYear.findIndex(s => s.name === currentSeasonName);
    let prevSeason = null;
    let nextSeason = null;

    if (currentIndex > 0) {
      prevSeason = seasonsInYear[currentIndex - 1];
    }
    if (currentIndex < seasonsInYear.length - 1) {
      nextSeason = seasonsInYear[currentIndex + 1];
    }
    return { prevSeason, nextSeason };
  };

  if (viewState === 'anime' && selectedAnime) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen pt-16">
        <AnimeBubble anime={selectedAnime} onClick={() => {}} isFocused={true} />
      </div>
    );
  }

  if (viewState === 'season' && selectedSeason) {
    const yearData = data.find(y => y.year === selectedSeason.year);
    if (!yearData) return null;

    const { prevSeason, nextSeason } = getAdjacentSeasons(yearData, selectedSeason.name);

    let mainWidth = 'w-full';
    let adjWidth = 'w-0'; 
    let prevWidth = 'w-0';
    let nextWidth = 'w-0';

    if (prevSeason && nextSeason) {
      mainWidth = 'w-[80%]';
      prevWidth = 'w-[10%]';
      nextWidth = 'w-[10%]';
    } else if (prevSeason || nextSeason) {
      mainWidth = 'w-[80%]';
      adjWidth = 'w-[20%]';
      if (prevSeason) prevWidth = adjWidth;
      if (nextSeason) nextWidth = adjWidth;
    }

    return (
      <div className="mt-8 flex h-full min-h-screen">
        {prevSeason && (
          <div className={`${prevWidth} p-2 flex-shrink-0`} onClick={() => onSeasonClick({ ...prevSeason, year: selectedSeason.year })}>
            {renderSeasonBlock(prevSeason, selectedSeason.year)}
          </div>
        )}
        <div className={`${mainWidth} p-2 flex-shrink-0`}>
          <div className={`${selectedSeason.color} p-6 rounded-[2rem] shadow-xl flex flex-col items-center justify-center min-h-[400px] w-full`}>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{selectedSeason.name} {selectedSeason.year}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selectedSeason.animes.map((anime) => (
                <AnimeBubble key={anime.id} anime={anime} onClick={onAnimeClick} isFocused={false} />
              ))}
            </div>
          </div>
        </div>
        {nextSeason && (
          <div className={`${nextWidth} p-2 flex-shrink-0`} onClick={() => onSeasonClick({ ...nextSeason, year: selectedSeason.year })}>
            {renderSeasonBlock(nextSeason, selectedSeason.year)}
          </div>
        )}
      </div>
    );
  }

  // Default view: full Drive Calendar
  return (
    <div className="mt-8">
      {data.map((yearData) => (
        <div key={yearData.year} className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">{yearData.year}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {yearData.seasons.map((season) => renderSeasonBlock(season, yearData.year))}
          </div>
        </div>
      ))}
    </div>
  );
}