// app/components/SearchAnimeModal.tsx
import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon as Search,
  FunnelIcon as Filter,
  BarsArrowUpIcon as SortAsc,
  BarsArrowDownIcon as SortDesc,
  CalendarDaysIcon,
  StarIcon ,
  PlayIcon ,
  ChevronDownIcon ,
  ArrowLeftIcon as IzqFlecha,
  ArrowRightIcon as DerFlecha,
  XMarkIcon as X,
  ArrowPathIcon as RefreshCw,
} from '@heroicons/react/24/outline';

interface Anime {
  id: number;
  name: string;
  year: number;
  season_name: string;
  state_name: string;
  rating_value: string;
  image_url: string;
}

interface AnimeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnimeSelect?: (anime: Anime) => void;
  isOwnProfile?: boolean; 
  profileUserId?: number; // Nueva prop para el ID del usuario del perfil
  profileUsername?: string; // Nueva prop para el nombre del usuario del perfil
}

const STATES_OPTIONS = [
  { id: 1, name: 'Viendo' },
  { id: 2, name: 'Terminado' },
  { id: 3, name: 'Pendiente' },
  { id: 4, name: 'Abandonado' },
];

const RATINGS_OPTIONS = [1, 2, 3, 4, 5];

const SEASONS_OPTIONS = [
  { id: 1, name: 'Invierno' }, 
  { id: 2, name: 'Primavera' }, 
  { id: 3, name: 'Verano' }, 
  { id: 4, name: 'Otoño' }
];

const AnimeSearchModal: React.FC<AnimeSearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onAnimeSelect,
  isOwnProfile = true,
  profileUserId,
  profileUsername = "Usuario"
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    state: '',
    year: '',
    season: '',
    rating: '',
    ratingOp: 'gte',
    sortBy: 'name',
    sortOrder: 'ASC'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) params.append('q', searchQuery.trim());
    if (filters.state !== 'all') params.append('state', filters.state);
    if (filters.year !== 'all') params.append('year', filters.year);
    if (filters.season !== 'all') params.append('season', filters.season);
    if (filters.rating !== 'all') {
      params.append('rating', filters.rating);
      params.append('ratingOp', filters.ratingOp);
    }
    params.append('sortBy', filters.sortBy);
    params.append('sortOrder', filters.sortOrder);
    params.append('limit', '20');
    params.append('offset', ((currentPage - 1) * 20).toString());

    // Agregar userId si no es el perfil propio
    if (!isOwnProfile && profileUserId) {
      params.append('userId', profileUserId.toString());
    }

    return params.toString();
  };

  const handleSearch = async () => {
    setIsLoading(true);
    
    // Construir parámetros de búsqueda
    const params = new URLSearchParams();
    
    if (searchQuery) params.append('q', searchQuery);
    if (filters.state) params.append('state', filters.state);
    if (filters.year) params.append('year', filters.year);
    if (filters.season) params.append('season', filters.season);
    if (filters.rating) {
      params.append('rating', filters.rating);
      params.append('ratingOp', filters.ratingOp);
    }
    params.append('sortBy', filters.sortBy);
    params.append('sortOrder', filters.sortOrder);
    params.append('limit', '20');
    params.append('offset', String((currentPage - 1) * 20));

    // Agregar userId si no es el perfil propio
    if (!isOwnProfile && profileUserId) {
      params.append('userId', profileUserId.toString());
    }

    try {
      const response = await fetch(`/api/user/animes/search?${params.toString()}`);
      if (!response.ok) throw new Error('Error en la búsqueda');
      
      const data = await response.json();
      setAnimes(data.animes || []);
    } catch (error) {
      console.error('Error al buscar animes:', error);
      setAnimes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      state: '',
      year: '',
      season: '',
      rating: '',
      ratingOp: 'gte',
      sortBy: 'name',
      sortOrder: 'ASC'
    });
    setCurrentPage(1);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'Viendo': return 'bg-green-100 text-green-800';
      case 'Terminado': return 'bg-blue-100 text-blue-800';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Abandonado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleSearch();
    }
  }, [filters, currentPage, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed mt-18 text-gray-700 inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Fondo oscuro con difuminado */}
      <div 
        className="fixed inset-0 text-gray-700 bg-opacity-50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Contenedor principal del modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con sombra inferior */}
        <div className="sticky top-0 z-10 bg-white p-6 pb-4 border-b border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {isOwnProfile ? 'Buscador de Animes' : `Buscar en Drive de ${profileUsername}`}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Barra de búsqueda */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={isOwnProfile ? "Buscar anime..." : `Buscar en el drive de ${profileUsername}...`}
                className="w-full px-5 py-2.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="ml-2 bg-blue-600 text-white p-3 rounded-full font-medium hover:bg-blue-700 transition-all flex items-center justify-center shadow-sm w-12 h-12"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-all flex items-center shadow-sm"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </button>
          </div>
        </div>

        {/* Contenido principal con gradiente de separación */}
        <div className="overflow-y-auto flex-1 bg-gradient-to-b from-white to-gray-50">
          {/* Filtros avanzados */}
          {showFilters && (
            <div className="p-6 pt-4 bg-white border-b border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={filters.state}
                    onChange={(e) => setFilters(prev => ({...prev, state: e.target.value}))}
                  >
                    <option value="">Todos</option>
                    {STATES_OPTIONS.map(state => (
                      <option key={state.id} value={state.name}>{state.name}</option>
                    ))}
                  </select>
                </div>

                {/* Año */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={filters.year}
                    onChange={(e) => setFilters(prev => ({...prev, year: e.target.value}))}
                    placeholder="Ej: 2023"
                  />
                </div>

                {/* Temporada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temporada
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={filters.season}
                    onChange={(e) => setFilters(prev => ({...prev, season: e.target.value}))}
                  >
                    <option value="">Todas</option>
                    {SEASONS_OPTIONS.map(season => (
                      <option key={season.id} value={season.name}>{season.name}</option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calificación
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={filters.ratingOp}
                      onChange={(e) => setFilters(prev => ({...prev, ratingOp: e.target.value}))}
                    >
                      <option value="gte">Mayor</option>
                      <option value="lte">Menor</option>
                      <option value="eq">Igual</option>
                    </select>
                    <select
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={filters.rating}
                      onChange={(e) => setFilters(prev => ({...prev, rating: e.target.value}))}
                    >
                      <option value="">0★</option>
                      {RATINGS_OPTIONS.map(rating => (
                        <option key={rating} value={rating}>{rating}★</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Ordenamiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({...prev, sortBy: e.target.value}))}
                  >
                    <option value="name">Nombre</option>
                    <option value="year">Año</option>
                    <option value="rating">Calificación</option>
                    <option value="created_at">Fecha Agregado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden
                  </label>
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 px-4 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all ${
                        filters.sortOrder === 'ASC' 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setFilters(prev => ({...prev, sortOrder: 'ASC'}))}
                    >
                      <SortAsc className="w-5 h-5" />
                      Ascendente
                    </button>
                    <button
                      className={`flex-1 px-4 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all ${
                        filters.sortOrder === 'DESC' 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setFilters(prev => ({...prev, sortOrder: 'DESC'}))}
                    >
                      <SortDesc className="w-5 h-5" />
                      Descendente
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <X className="w-5 h-5" />
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}

          {/* Resultados */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Resultados
              </h3>
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {animes.length} encontrados
              </span>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="ml-3 text-gray-600">Buscando animes...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {animes.map(anime => (
                  <div 
                    key={anime.id} 
                    className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      if (onAnimeSelect) {
                        onAnimeSelect(anime);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex gap-4">
                      <img 
                        src={anime.image_url || '/default-anime-image.jpg'} 
                        alt={anime.name}
                        className="w-14 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/default-anime-image.jpg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{anime.name}</h3>
                        <div className="text-sm text-gray-600 space-y-1 mt-1">
                          <p>{anime.year} • {anime.season_name}</p>
                          <p>Rating: <span className="font-medium">{anime.rating_value}</span></p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStateColor(anime.state_name)}`}>
                            {anime.state_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {!isLoading && animes.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No se encontraron animes</p>
                      <p className="text-sm mt-2">
                        {isOwnProfile 
                          ? "Intenta ajustar tus filtros de búsqueda" 
                          : `No se encontraron animes en el drive de ${profileUsername} con los criterios seleccionados`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer con sombra superior */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-inner">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm w-12 h-12 flex items-center justify-center"
            >
            <IzqFlecha className="w-5 h-5" />

            </button>
            <span className="text-sm font-medium text-gray-700">
              Página {currentPage} {animes.length > 0 && `de ${Math.ceil(animes.length / 20 + 1)}`}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={animes.length < 20}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm w-12 h-12 flex items-center justify-center"
            >
              <DerFlecha className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeSearchModal;