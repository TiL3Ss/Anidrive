// pages/profile.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import AnimeCarousel from '../components/AnimeCarousel';
import DriveCalendar from '../components/DriveCalendar'; // Importa el calendario

export default function ProfilePage() {
  const [animesWatching, setAnimesWatching] = useState([]);
  const [driveData, setDriveData] = useState([]); // Datos para el Drive/Calendario
  const [viewState, setViewState] = useState('drive'); // 'drive', 'season', 'anime'
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedAnime, setSelectedAnime] = useState(null);

  // Simula la obtención de datos de animes.
  // En un entorno real, harías llamadas a tus API Routes.
  useEffect(() => {
    // Fetch animes watching
    const fetchWatchingAnimes = async () => {
      // const response = await fetch('/api/user/animesWatching');
      // const data = await response.json();
      // setAnimesWatching(data);
      setAnimesWatching([
        { id: 1, title: 'Attack on Titan', imageUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', currentEpisode: 20, totalEpisodes: 25 },
        { id: 2, title: 'Jujutsu Kaisen', imageUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', currentEpisode: 10, totalEpisodes: 24 },
        { id: 3, title: 'My Hero Academia', imageUrl: 'https://cdn.myanimelist.net/images/anime/10/78745.jpg', currentEpisode: 5, totalEpisodes: 12 },
        { id: 4, title: 'Spy x Family', imageUrl: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg', currentEpisode: 8, totalEpisodes: 12 },
        { id: 5, title: 'Dandadan', imageUrl: 'https://cdn.myanimelist.net/images/anime/1584/143719.jpg', currentEpisode: 12, totalEpisodes: 12 },
      ]);
    };

    // Fetch drive data (animes por año/temporada)
    const fetchDriveData = async () => {
      // const response = await fetch('/api/user/driveData');
      // const data = await response.json();
      // setDriveData(data);

      const currentYear = new Date().getFullYear();
      setDriveData([
        {
          year: currentYear,
          seasons: [
            {
              name: 'Invierno',
              color: 'bg-blue-200',
              animes: [
                { id: 101, title: 'Mushoku Tensei Season 2', imageUrl: 'https://cdn.myanimelist.net/images/anime/1898/138005.jpg', rating: '4★', currentEpisode: 10, totalEpisodes: 12, season: 1 },
                { id: 102, title: 'Solo Leveling', imageUrl: 'https://cdn.myanimelist.net/images/anime/1801/142390.jpg', rating: '5★', currentEpisode: 8, totalEpisodes: 12, season: 1 },
                { id: 103, title: 'Frieren Beyond Journey\'s End', imageUrl: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg', rating: '5★', currentEpisode: 24, totalEpisodes: 28, season: 1 },
              ]
            },
            {
              name: 'Primavera',
              color: 'bg-green-200',
              animes: [
                { id: 104, title: 'Kaiju No. 8', imageUrl: 'https://cdn.myanimelist.net/images/anime/1370/140362.jpg', rating: '4★', currentEpisode: 5, totalEpisodes: 12, season: 2 },
                { id: 105, title: 'My reinc. as a slime', imageUrl: 'https://cdn.myanimelist.net/images/anime/1069/123309.jpg', rating: '4★', currentEpisode: 3, totalEpisodes: 12, season: 2 },
                { id: 106, title: 'Kono Subarashii Sekai ni Shukufuku wo!', imageUrl: 'https://cdn.myanimelist.net/images/anime/1895/142748.jpg', rating: '5★', currentEpisode: 1, totalEpisodes: 10, season: 2 },
                { id: 107, title: 'W.I.T.C.H', imageUrl: 'https://cdn.myanimelist.net/images/manga/2/265656.jpg', rating: '5★', currentEpisode: 1, totalEpisodes: 10, season: 2 },
              ]
            },
            {
              name: 'Verano',
              color: 'bg-red-200',
              animes: [
                { id: 108, title: 'Re:Zero Season 3', imageUrl: 'https://cdn.myanimelist.net/images/anime/1522/128039.jpg', rating: '4★', currentEpisode: 1, totalEpisodes: 12, season: 3 },
              ]
            },
            {
              name: 'Otoño',
              color: 'bg-yellow-200',
              animes: [
                { id: 109, title: 'Gachiakuta', imageUrl: 'https://cdn.myanimelist.net/images/anime/1682/150432.jpg', rating: '3★', currentEpisode: 0, totalEpisodes: 12, season: 4 },
              ]
            },
          ]
        },
        {
          year: currentYear - 1,
          seasons: [
            {
              name: 'Invierno',
              color: 'bg-blue-200',
              animes: [
                { id: 201, title: 'Chainsaw Man', imageUrl: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', rating: '4★', currentEpisode: 12, totalEpisodes: 12, season: 1 },
              ]
            },
            {
              name: 'Primavera',
              color: 'bg-green-200',
              animes: [
                { id: 202, title: 'Spy x Family Part 2', imageUrl: 'https://cdn.myanimelist.net/images/anime/1506/138982.jpg', rating: '5★', currentEpisode: 12, totalEpisodes: 12, season: 2 },
              ]
            },
          ]
        },
        {
          year: currentYear - 2,
          seasons: [
            {
              name: 'Invierno',
              color: 'bg-blue-200',
              animes: [
                { id: 301, title: 'Sono Bisque Doll wa Koi wo Suru', imageUrl: 'https://cdn.myanimelist.net/images/anime/1179/119897.jpg', rating: '5★', currentEpisode: 12, totalEpisodes: 12, season: 1 },
              ]
            },
          ]
        }
      ]);
    };

    fetchWatchingAnimes();
    fetchDriveData();
  }, []);

  const handleSeasonClick = (seasonData) => {
    setSelectedSeason(seasonData);
    setViewState('season');
  };

  const handleAnimeClick = (animeData) => {
    setSelectedAnime(animeData);
    setViewState('anime');
  };

  const handleBack = () => {
    if (viewState === 'anime') {
      setViewState('season');
      setSelectedAnime(null);
    } else if (viewState === 'season') {
      setViewState('drive');
      setSelectedSeason(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head>
        <title>Mi Perfil - AnimeDrive</title>
      </Head>

      {/* Simulamos que el usuario ya está logueado para mostrar el perfil directamente */}
      <Header isLoggedIn={true} onLogout={() => console.log("Logout")} /> {/* Aquí integrarías la lógica real de logout */}

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Mi Perfil</h1>

        {viewState === 'drive' && (
          <>
            <section className="mb-12">
              <h2 className="text-3xl font-semibold text-gray-700 mb-6">Viendo Actualmente</h2>
              <AnimeCarousel animes={animesWatching} />
            </section>

            <section>
              <h2 className="text-3xl font-semibold text-gray-700 mb-6">Su Drive</h2>
              <DriveCalendar
                data={driveData}
                onSeasonClick={handleSeasonClick}
                onAnimeClick={handleAnimeClick}
                viewState={viewState}
                selectedSeason={selectedSeason}
                selectedAnime={selectedAnime}
              />
            </section>
          </>
        )}

        {viewState === 'season' && selectedSeason && (
          <div className="relative">
            <button
              onClick={handleBack}
              className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 z-10"
            >
              Volver Atrás
            </button>
            <DriveCalendar
              data={driveData}
              onSeasonClick={handleSeasonClick}
              onAnimeClick={handleAnimeClick}
              viewState={viewState}
              selectedSeason={selectedSeason}
              selectedAnime={selectedAnime}
            />
          </div>
        )}

        {viewState === 'anime' && selectedAnime && (
          <div className="relative">
            <button
              onClick={handleBack}
              className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 z-10"
            >
              Volver Atrás
            </button>
            <DriveCalendar
              data={driveData}
              onSeasonClick={handleSeasonClick}
              onAnimeClick={handleAnimeClick}
              viewState={viewState}
              selectedSeason={selectedSeason}
              selectedAnime={selectedAnime}
            />
          </div>
        )}
      </main>
    </div>
  );
}