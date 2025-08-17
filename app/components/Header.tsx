// components/Header.js
'use client'
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { useState, useEffect, useRef } from 'react';
import { UserCircleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function Header({ onLoginClick, onRegisterClick, isLoggedIn, onLogout, username }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const router = useRouter();

  // Referencias para manejar clicks fuera del dropdown
  const searchRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Detectar scroll para cambiar opacidad del header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsDropdownOpen(false);
  };

  // Función para buscar usuarios
  const searchUsers = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
    try {
      const response = await fetch(`/api/user/search?q=${encodeURIComponent(query.trim())}`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
        setShowSearchResults(true);
        setSearchError(null);
      } else {
        let errorMessage = 'Error al buscar usuarios';
        
        if (response.status === 401) {
          errorMessage = 'Debes iniciar sesión para buscar usuarios';
        } else if (response.status === 404) {
          errorMessage = 'Servicio de búsqueda no disponible';
        } else if (response.status === 500) {
          errorMessage = 'Error del servidor. Intenta de nuevo más tarde';
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
        }
        
        setSearchError(errorMessage);
        setSearchResults([]);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      
      let errorMessage = 'Error de conexión';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Búsqueda cancelada';
      } else {
        errorMessage = 'Error inesperado. Intenta de nuevo';
      }
      
      setSearchError(errorMessage);
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Manejar clicks fuera de los dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchError(null);
  };

  const handleUserSelect = (user) => {
    router.push(`/profile/${user.username}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
      ${isScrolled 
        ? 'bg-slate-800/85 backdrop-blur-xl border-b border-slate-700/50 shadow-xl' 
        : 'bg-slate-800/80 backdrop-blur-md border-b border-slate-600/30 shadow-lg'
      }
      py-3 px-6 flex justify-between items-center
    `}>
      {/* Logo y marca */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 relative overflow-hidden rounded-2xl shadow-sm"> 
          <Image
            src="/images/fondo.png"
            alt="Logo FT"
            fill
            className="object-contain"
          />
        </div>
        <Link href="/">
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            AniDrive
          </span>
        </Link>
      </div>

      {/* Buscador de usuarios - Movido a la derecha */}
      <div className="flex items-center space-x-4">
        {isLoggedIn && (
          <div className="relative w-80" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Buscar usuarios"
                className={`
                  w-full pl-11 pr-10 py-2.5 text-sm text-slate-200
                  bg-slate-700/70 backdrop-blur-sm
                  border border-slate-600/50
                  rounded-2xl
                  focus:bg-slate-700/90 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50
                  transition-all duration-200 ease-in-out
                  placeholder:text-slate-400
                  shadow-sm hover:shadow-md hover:bg-slate-700/80
                `}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors duration-150"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown de resultados con tema oscuro */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl max-h-80 overflow-hidden">
                {isSearching ? (
                  <div className="px-6 py-4 text-sm text-slate-400 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-600 border-t-cyan-400"></div>
                      <span className="font-medium">Buscando...</span>
                    </div>
                  </div>
                ) : searchError ? (
                  <div className="px-6 py-4 text-sm text-center">
                    <div className="flex items-center justify-center space-x-2 text-red-400 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">Error</span>
                    </div>
                    <p className="text-slate-300 mb-3">{searchError}</p>
                    <button
                      onClick={() => searchUsers(searchQuery)}
                      className="px-4 py-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-full transition-colors duration-150"
                    >
                      Intentar de nuevo
                    </button>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2 max-h-72 overflow-y-auto">
                    {searchResults.map((user, index) => (
                      <button
                        key={`${user.username}${user.tag}`}
                        onClick={() => handleUserSelect(user)}
                        className={`
                          w-full px-6 py-3 text-left hover:bg-slate-700/60 focus:bg-slate-700/60 
                          focus:outline-none transition-colors duration-150
                          ${index !== searchResults.length - 1 ? 'border-b border-slate-700/50' : ''}
                        `}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                              <UserCircleIcon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-200 truncate">
                              {user.username}
                              <span className="text-cyan-400 font-medium ml-0.5">{user.tag}</span>
                            </p>
                            {user.email && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-4 text-sm text-slate-400 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="font-medium">No se encontraron usuarios</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Intenta con otro término de búsqueda
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navegación */}
        <nav className="relative">
          {isLoggedIn ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={toggleDropdown}
                className={`
                  flex items-center justify-center w-11 h-11 rounded-2xl
                  bg-gradient-to-br from-cyan-500 to-blue-600 text-white 
                  hover:from-cyan-400 hover:to-blue-500 
                  transition-all duration-200 ease-in-out 
                  focus:outline-none focus:ring-2 focus:ring-cyan-400/30
                  shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95
                `}
                aria-label="Menú de perfil"
              >
                <UserCircleIcon className="h-6 w-6" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-600/50 py-2 z-70 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <p className="text-sm font-semibold text-slate-200">
                      Hola, {username || 'Usuario'}
                    </p>
                  </div>
                  
                  <Link 
                    href="/" 
                    className="block px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-slate-200 transition-colors duration-150" 
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <UserCircleIcon className="h-4 w-4 text-slate-400" />
                      <span>Perfil</span>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/extras" 
                    className="block px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-slate-200 transition-colors duration-150" 
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      <span>Extras</span>
                    </div>
                  </Link>
                  
                  <div className="border-t border-slate-700/50 mt-1">
                    <button
                      onClick={handleLogoutClick}
                      className="block w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={onLoginClick}
                className={`
                  px-6 py-2.5 rounded-2xl font-semibold text-sm
                  bg-slate-700/70 text-slate-300 border border-slate-600/50
                  hover:bg-slate-600/80 hover:border-slate-500/50 hover:text-slate-200
                  backdrop-blur-sm
                  transition-all duration-200 ease-in-out
                  shadow-sm hover:shadow-md 
                  transform hover:scale-105 active:scale-95
                `}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={onRegisterClick}
                className={`
                  px-6 py-2.5 rounded-2xl font-semibold text-sm text-white
                  bg-gradient-to-r from-cyan-500 to-blue-600
                  hover:from-cyan-400 hover:to-blue-500
                  transition-all duration-200 ease-in-out
                  shadow-lg hover:shadow-xl 
                  transform hover:scale-105 active:scale-95
                `}
              >
                Registrarse
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Espaciador para compensar el header fijo */}
      <style jsx global>{`
        body {
          padding-top: 80px;
        }
      `}</style>
    </header>
  );
}