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
  const [searchError, setSearchError] = useState(null); // Nuevo estado para errores
  
  const router = useRouter();

  // Referencias para manejar clicks fuera del dropdown
  const searchRef = useRef(null);
  const profileDropdownRef = useRef(null);

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
    setSearchError(null); // Limpiar errores anteriores
    
    try {
      const response = await fetch(`/api/user/search?q=${encodeURIComponent(query.trim())}`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
        setShowSearchResults(true);
        setSearchError(null);
      } else {
        // Manejar errores HTTP específicos
        let errorMessage = 'Error al buscar usuarios';
        
        if (response.status === 401) {
          errorMessage = 'Debes iniciar sesión para buscar usuarios';
        } else if (response.status === 404) {
          errorMessage = 'Servicio de búsqueda no disponible';
        } else if (response.status === 500) {
          errorMessage = 'Error del servidor. Intenta de nuevo más tarde';
        } else {
          // Intentar obtener el mensaje de error del servidor
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
      
      // Determinar el tipo de error de red
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

  // Debounce para la búsqueda (evita hacer muchas peticiones)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300); // 300ms de delay

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
    setSearchError(null); // Limpiar errores también
  };

  const handleUserSelect = (user) => {
    router.push(`/profile/${user.username}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center z-50">
      <div className="flex items-center space-x-4">
        <Image
            src="/images/icon-image.jpg"
            alt="Logo FT"
            width={500}
            height={500}
            className="object-contain" 
          />
        <Link href="/">
          <span className="text-2xl font-bold text-blue-600">AnimeDrive</span>
        </Link>
      </div>

      {/* Buscador de usuarios - Centrado */}
      {isLoggedIn && (
        <div className="absolute left-1/2 transform -translate-x-1/2 text-gray-700 w-full max-w-md px-4 " ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Buscar usuarios (ej: usuario#123)"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm hover:shadow-md transition-shadow duration-200"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Dropdown de resultados */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto z-60">
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Buscando...</span>
                  </div>
                </div>
              ) : searchError ? (
                <div className="px-4 py-3 text-sm text-center">
                  <div className="flex items-center justify-center space-x-2 text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="mt-1 text-red-500">{searchError}</p>
                  <button
                    onClick={() => searchUsers(searchQuery)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-1">
                  {searchResults.map((user) => (
                    <button
                      key={`${user.username}${user.tag}`}
                      onClick={() => handleUserSelect(user)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors duration-150"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <UserCircleIcon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.username}
                            <span className="text-blue-600 font-normal">{user.tag}</span>
                          </p>
                          {user.email && (
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>No se encontraron usuarios</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Intenta con otro término de búsqueda
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <nav className="relative">
        {isLoggedIn ? (
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Menú de perfil"
            >
              <UserCircleIcon className="h-6 w-6" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-70">
                <p className="block px-4 py-2 text-sm text-gray-800 font-semibold border-b border-gray-100">
                  Hola, {username || 'Usuario'}
                </p>
                <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsDropdownOpen(false)}>
                  Perfil
                </Link>
                <Link href="/extras" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsDropdownOpen(false)}>
                  Extras
                </Link>
                <button
                  onClick={handleLogoutClick}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={onLoginClick}
              className="ml-4 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-full font-semibold border border-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-95"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={onRegisterClick}
             className="ml-4 bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-95"
            >
              Registrarse
            </button>
          </>
        )}
      </nav>
    </header>
  );
}