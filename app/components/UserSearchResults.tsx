// components/UserSearchResults.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface User {
  username: string;
  tag: string;
  email: string;
}

interface UserSearchResultsProps {
  searchQuery: string;
}

export default function UserSearchResults({ searchQuery }: UserSearchResultsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery && searchQuery.trim().length > 0) {
      searchUsers(searchQuery);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/user/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Error al buscar usuarios');
      console.error('Error en búsqueda:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!searchQuery || searchQuery.trim().length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-2">
        <div className="text-center text-gray-500">Buscando usuarios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-2">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-2">
        <div className="text-center text-gray-500">No se encontraron usuarios</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg mt-2 max-h-96 overflow-y-auto">
      {users.map((user, index) => (
        <Link
          key={`${user.username}-${index}`}
          href={`/profile/${user.username}`}
          className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {user.username}{user.tag}
              </div>
              <div className="text-sm text-gray-500">
                Haz clic para ver el perfil
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}