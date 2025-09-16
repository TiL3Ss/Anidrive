// components/Header.js
'use client'
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { useState, useEffect, useRef } from 'react';
import { 
  UserCircleIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  Bars3Icon,
  XMarkIcon as MenuCloseIcon 
} from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function Header({ onLoginClick, onRegisterClick, isLoggedIn, onLogout, username }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const mobileMenuRef = useRef(null);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
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
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
        ${isScrolled 
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-xl' 
          : 'bg-white/85 backdrop-blur-md border-b border-gray-100/60 shadow-lg'
        }
        py-4.5 px-4  sm:px-6 flex justify-between items-center
      `}>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Logo */}
          <div className="relative w-8 h-8 sm:w-10 sm:h-10">
            <Image
              src="/images/logo_O.png"
              alt="AniDrive Logo"
              fill
              className="
                rounded-xl object-contain transition-all duration-300
                hover:drop-shadow-lg hover:scale-110
                scale-125 sm:scale-150
              "
              priority
            />
          </div>
          <Link href="/">
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              AniDrive
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Buscador de usuarios - Solo en desktop */}
          {isLoggedIn && (
            <div className="relative w-80" ref={searchRef}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-blue-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Buscar usuarios"
                  className={`
                    w-full pl-11 pr-10 py-2.5 text-sm text-gray-700
                    bg-gray-50/80 backdrop-blur-sm
                    border border-gray-200/80
                    rounded-2xl
                    focus:bg-white/90 focus:ring-2 focus:ring-cyan-300/30 focus:border-cyan-300/80
                    transition-all duration-200 ease-in-out
                    placeholder:text-gray-400
                    shadow-sm hover:shadow-md hover:bg-gray-50/90
                  `}
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="cursor-pointer absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-600 transition-colors duration-150"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dropdown de resultados */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-2xl max-h-80 overflow-hidden">
                  {isSearching ? (
                    <div className="px-6 py-4 text-sm text-gray-500 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
                        <span className="font-medium">Buscando...</span>
                      </div>
                    </div>
                  ) : searchError ? (
                    <div className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center space-x-2 text-red-500 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">Error</span>
                      </div>
                      <p className="text-gray-600 mb-3">{searchError}</p>
                      <button
                        onClick={() => searchUsers(searchQuery)}
                        className=" px-4 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors duration-150"
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
                            cursor-pointer w-full px-6 py-3 text-left hover:bg-blue-100/80 focus:bg-gray-50/80 
                            focus:outline-none transition-colors duration-150
                            ${index !== searchResults.length - 1 ? 'border-b border-gray-100/60' : ''}
                          `}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-sm">
                                <UserCircleIcon className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {user.username}
                                <span className="text-blue-600 font-medium ml-0.5">{user.tag}</span>
                              </p>
                              {user.email && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {user.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-4 text-sm text-gray-500 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="font-medium">No se encontraron usuarios</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Intenta con otro término de búsqueda
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Desktop Auth Buttons */}
          {isLoggedIn ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={toggleDropdown}
                className={`
                  flex items-center justify-center w-11 h-11 rounded-2xl
                  bg-gradient-to-br from-blue-500 to-cyan-600 text-white 
                  hover:from-blue-400 hover:to-cyan-500 
                  transition-all duration-200 ease-in-out 
                  focus:outline-none focus:ring-2 focus:ring-blue-400/30
                  shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95
                `}
                aria-label="Menú de perfil"
              >
                <UserCircleIcon className="h-6 w-6" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/80 py-2 z-70 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100/60">
                    <p className="text-sm font-semibold text-gray-800">
                      Hola, {username || 'Usuario'}
                    </p>
                  </div>
                  
                  <Link 
                    href="/" 
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 transition-colors duration-150" 
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <UserCircleIcon className="h-4 w-4 text-gray-500" />
                      <span>Perfil</span>
                    </div>
                  </Link>
                  
                  
                  
                  <div className="border-t border-gray-100/60 mt-1">
                    <button
                      onClick={handleLogoutClick}
                      className="cursor-pointer block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50/80 hover:text-red-700 transition-colors duration-150"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  cursor-pointer px-6 py-2.5 rounded-2xl font-semibold text-sm
                  bg-gray-100/80 text-gray-700 border border-gray-200/80
                  hover:bg-gray-200/90 hover:border-gray-300/80 hover:text-gray-900
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
                  cursor-pointer px-6 py-2.5 rounded-2xl font-semibold text-sm text-white
                  bg-gradient-to-r from-blue-500 to-cyan-600
                  hover:from-blue-400 hover:to-cyan-500
                  transition-all duration-200 ease-in-out
                  shadow-lg hover:shadow-xl 
                  transform hover:scale-105 active:scale-95
                `}
              >
                Registrarse
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className={`
              flex items-center justify-center w-10 h-10 rounded-xl
              bg-gray-100/80 text-gray-700 border border-gray-200/60
              hover:bg-gray-200/90 hover:border-gray-300/80
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-blue-400/30
              shadow-sm hover:shadow-md
            `}
            aria-label="Menú móvil"
          >
            {isMobileMenuOpen ? (
              <MenuCloseIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="fixed top-[80px] left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-xl md:hidden"
        >
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            {isLoggedIn && (
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-blue-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Buscar usuarios"
                    className={`
                      w-full pl-11 pr-10 py-3 text-sm text-gray-700
                      bg-gray-50/80 backdrop-blur-sm
                      border border-gray-200/80
                      rounded-2xl
                      focus:bg-white/90 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/60
                      transition-all duration-200 ease-in-out
                      placeholder:text-gray-400
                      shadow-sm
                    `}
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-150"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Mobile Search Results */}
                {showSearchResults && (
                  <div className="mt-2 bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-xl max-h-64 overflow-hidden">
                    {isSearching ? (
                      <div className="px-4 py-4 text-sm text-gray-500 text-center">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
                          <span className="font-medium">Buscando...</span>
                        </div>
                      </div>
                    ) : searchError ? (
                      <div className="px-4 py-4 text-sm text-center">
                        <div className="flex items-center justify-center space-x-2 text-red-500 mb-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold">Error</span>
                        </div>
                        <p className="text-gray-600 mb-3 text-xs">{searchError}</p>
                        <button
                          onClick={() => searchUsers(searchQuery)}
                          className="px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors duration-150"
                        >
                          Intentar de nuevo
                        </button>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2 max-h-56 overflow-y-auto">
                        {searchResults.map((user, index) => (
                          <button
                            key={`${user.username}${user.tag}`}
                            onClick={() => handleUserSelect(user)}
                            className={`
                              w-full px-4 py-3 text-left hover:bg-gray-50/80 focus:bg-gray-50/80 
                              focus:outline-none transition-colors duration-150
                              ${index !== searchResults.length - 1 ? 'border-b border-gray-100/60' : ''}
                            `}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-sm">
                                  <UserCircleIcon className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {user.username}
                                  <span className="text-blue-600 font-medium ml-0.5">{user.tag}</span>
                                </p>
                                {user.email && (
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {user.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-4 text-sm text-gray-500 text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span className="font-medium">No se encontraron usuarios</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Intenta con otro término de búsqueda
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Navigation */}
            {isLoggedIn ? (
              <div className="space-y-2">
                <div className="px-4 py-2 border-b border-gray-100/60">
                  <p className="text-sm font-semibold text-gray-800">
                    Hola, {username || 'Usuario'}
                  </p>
                </div>
                
                <Link 
                  href="/" 
                  className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 rounded-xl transition-colors duration-150" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserCircleIcon className="h-5 w-5 text-gray-500" />
                  <span>Perfil</span>
                </Link>
                
                <button
                  onClick={handleLogoutClick}
                  className="cursor-pointer flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50/80 hover:text-red-700 rounded-xl transition-colors duration-150"
                >
                  <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onLoginClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full cursor-pointer px-6 py-3 rounded-2xl font-semibold text-sm
                    bg-gray-100/80 text-gray-700 border border-gray-200/80
                    hover:bg-gray-200/90 hover:border-gray-300/80 hover:text-gray-900
                    backdrop-blur-sm
                    transition-all duration-200 ease-in-out
                    shadow-sm hover:shadow-md 
                  `}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    onRegisterClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full cursor-pointer px-6 py-3 rounded-2xl font-semibold text-sm text-white
                    bg-gradient-to-r from-blue-500 to-cyan-600
                    hover:from-blue-400 hover:to-cyan-500
                    transition-all duration-200 ease-in-out
                    shadow-lg hover:shadow-xl 
                  `}
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>
        </div>
        
      )}

      {/* Espaciador para compensar el header fijo */}
      <style jsx global>{`
        body {
          padding-top: 80px;
        }
        
        @media (max-width: 768px) {
          body {
            padding-top: ${isMobileMenuOpen ? '320px' : '80px'};
          }
        }
      `}</style>
    </>
    
  );
 
}