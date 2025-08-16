// components/EditAnimeModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface AnimeDataForEdit {
  id: number;
  title: string;
  imageUrl: string | null;
  rating?: string | null;
  currentEpisode?: number | null;
  totalChapters?: number | null;
  seasonCour: string;
  year: number;
  seasonName: string | null; 
  seasonColor?: string;
  state_name?: string | null; 
}

interface EditAnimeModalProps {
  animeData: AnimeDataForEdit;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// Opciones estáticas (deben coincidir con las de AddAnimeModal y tu DB)
const STATES_VIEW_OPTIONS = [
  { id: 1, name: 'Viendo' },
  { id: 2, name: 'Terminado' },
  { id: 3, name: 'Pendiente' },
  { id: 4, name: 'Abandonado' },
];

const RATINGS_OPTIONS = [
  { id: 1, value: '1★' }, { id: 2, value: '2★' }, { id: 3, value: '3★' },
  { id: 4, value: '4★' }, { id: 5, value: '5★' },
];

const SEASONS_OPTIONS = [
  { id: 1, name: 'Invierno' }, { id: 2, name: 'Primavera' }, { id: 3, name: 'Verano' }, { id: 4, name: 'Otoño' }
];

const EditAnimeModal: React.FC<EditAnimeModalProps> = ({ animeData, onClose, onSuccess, onError }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Estados inicializados con los datos del animeData
  const [currentChapter, setCurrentChapter] = useState(animeData.currentEpisode?.toString() || '0');
  const [selectedState, setSelectedState] = useState(
    STATES_VIEW_OPTIONS.find(s => s.name === animeData.state_name)?.id.toString() || STATES_VIEW_OPTIONS[0]?.id.toString() || ''
  );
  const [selectedRating, setSelectedRating] = useState(
    RATINGS_OPTIONS.find(r => r.value === animeData.rating)?.id.toString() || ''
  );

  const [isLoading, setIsLoading] = useState(false);

  // Efecto para actualizar los estados si animeData cambia
  useEffect(() => {
    setCurrentChapter(animeData.currentEpisode?.toString() || '0');
    setSelectedState(STATES_VIEW_OPTIONS.find(s => s.name === animeData.state_name)?.id.toString() || STATES_VIEW_OPTIONS[0]?.id.toString() || '');
    setSelectedRating(RATINGS_OPTIONS.find(r => r.value === animeData.rating)?.id.toString() || '');
  }, [animeData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!userId) {
      onError('Error: ID de usuario no disponible. Por favor, inicia sesión de nuevo.');
      setIsLoading(false);
      return;
    }

    // Validaciones básicas
    if (!currentChapter || !selectedState) {
        onError('Por favor, completa los campos obligatorios (Capítulo Actual, Estado).');
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/user/animes/update', { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          animeId: animeData.id,
          currentChapter: parseInt(currentChapter),
          stateId: parseInt(selectedState),
          rateId: selectedRating ? parseInt(selectedRating) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el anime.');
      }

      // CAMBIO IMPORTANTE: Solo llamar onSuccess, sin forzar reload
      onSuccess('¡Anime actualizado con éxito!');
      // NO cerrar el modal inmediatamente, dejamos que el componente padre maneje el flujo

    } catch (error: any) {
      console.error('Error updating anime:', error);
      onError(`Error: ${error.message || 'No se pudo actualizar el anime.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white text-gray-700 p-8 rounded-lg shadow-xl max-w-lg w-full relative overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-500">Editar Anime: {animeData.title}</h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-700 hover:text-red-700 text-2xl font-semibold"
          aria-label="Cerrar"
        >
          &times;
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Anime
            </label>
            <input
              type="text"
              value={animeData.title}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="currentChapter" className="block text-sm font-medium text-gray-700 mb-1">
                Capítulo Actual <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="currentChapter"
                value={currentChapter}
                onChange={(e) => {
                  const newChapter = e.target.value;
                  setCurrentChapter(newChapter);
                  
                  if (animeData.totalChapters && parseInt(newChapter) === animeData.totalChapters) {
                    setSelectedState('2');
                  }
                }}
                required
                min="0"
                max={animeData.totalChapters || undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="totalChapters" className="block text-sm font-medium text-gray-700 mb-1">
                Capítulos Totales
              </label>
              <input
                type="number"
                id="totalChapters"
                value={animeData.totalChapters || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="selectedState" className="block text-sm font-medium text-gray-700 mb-1">
              Estado <span className="text-red-500">*</span>
            </label>
            <select
              id="selectedState"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              {STATES_VIEW_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="selectedRating" className="block text-sm font-medium text-gray-700 mb-1">
              Calificación
            </label>
            <select
              id="selectedRating"
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Seleccionar</option>
              {RATINGS_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.value}
                </option>
              ))}
            </select>
          </div>

          <div className='flex justify-center'>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-semibold text-white px-5 py-2.5 text-center rounded-full transition duration-300 ease-in-out
                ${isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
                }`}
            >
              {isLoading ? 'Actualizando...' : 'Actualizar Anime'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAnimeModal;