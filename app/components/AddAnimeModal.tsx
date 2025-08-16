// components/AddAnimeModal.tsx
'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import NotificationToast from './NotificationToast';
import { useTemporalForm } from '../hooks/useTemporalForm';
import { HomeModernIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface AddAnimeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}


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


const AddAnimeModal: React.FC<AddAnimeModalProps> = ({ onClose, onSuccess }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  
  
  const [formData, setFormData] = useTemporalForm('animeFormData', {
    animeName: '',
    seasonCour: '',
    year: '',
    totalChapters: '',
    currentChapter: '0',
    selectedState: STATES_VIEW_OPTIONS[0]?.id.toString() || '',
    selectedRating: '',
    selectedSeasonId: SEASONS_OPTIONS[0]?.id.toString() || '',
    addReview: false,
    reviewText: ''
  });

  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Lógica especial para cuando se completa el capítulo actual igual al total
    if (name === 'currentChapter' && formData.totalChapters && value === formData.totalChapters) {
      setFormData(prev => ({ ...prev, selectedState: '2' }));
    }
    if (name === 'totalChapters' && formData.currentChapter && value === formData.currentChapter) {
      setFormData(prev => ({ ...prev, selectedState: '2' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setIsLoading(true);

    if (!userId) {
      setNotification({ 
        message: 'Error: ID de usuario no disponible. Por favor, inicia sesión de nuevo.', 
        type: 'error' 
      });
      setIsLoading(false);
      return;
    }

    // Validación de campos obligatorios
    if (!formData.animeName || !formData.year || !formData.seasonCour || !formData.selectedState || !formData.selectedSeasonId) {
      setNotification({ 
        message: 'Por favor, completa todos los campos obligatorios.', 
        type: 'error' 
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/animes/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          animeName: formData.animeName,
          seasonCour: formData.seasonCour,
          year: parseInt(formData.year),
          totalChapters: formData.totalChapters ? parseInt(formData.totalChapters) : null,
          currentChapter: parseInt(formData.currentChapter),
          stateId: parseInt(formData.selectedState),
          rateId: formData.selectedRating ? parseInt(formData.selectedRating) : null,
          seasonId: parseInt(formData.selectedSeasonId),
          review: formData.addReview ? formData.reviewText : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Este anime ya ha sido añadido a tu Drive.');
        }
        throw new Error(data.message || 'Error al añadir el anime.');
      }

      if (response.ok) {
        sessionStorage.removeItem('animeFormData');
        setFormData({
        animeName: '',
        seasonCour: '',
        year: '',
        totalChapters: '',
        currentChapter: '0',
        selectedState: STATES_VIEW_OPTIONS[0]?.id.toString() || '',
        selectedRating: '',
        selectedSeasonId: SEASONS_OPTIONS[0]?.id.toString() || '',
        addReview: false,
        reviewText: ''
        });
      }

      setNotification({ 
        message: '¡Anime añadido con éxito!', 
        type: 'success' 
      });
      
      
      
      
      // Recargar la lista de animes
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error adding anime:', error);
      setNotification({ 
        message: error.message || 'No se pudo añadir el anime. Por favor intenta nuevamente.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <>
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white text-gray-700 p-8 rounded-lg shadow-xl max-w-lg w-full relative overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-500">Añadir Nuevo Anime</h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-700 hover:text-red-700 text-2xl font-semibold"
          aria-label="Cerrar"
        >
          &times;
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="animeName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Anime <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="animeName"
              name="animeName"
              value={formData.animeName}
              onChange={handleChange}
              required
              className="w-full px-5 py-2.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="seasonCour" className="block text-sm font-medium text-gray-700 mb-1">
                Temporada/Cour <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="seasonCour"
                name="seasonCour"
                value={formData.seasonCour}
                onChange={handleChange}
                required
                maxLength={5}
                className="w-full px-5 py-2.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
                placeholder="Ej: 1ra, 2da"
              />
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Año <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                min="1900"
                max="2100"
                className="w-full px-5 py-2.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="totalChapters" className="block text-sm font-medium text-gray-700 mb-1">
                Capítulos Totales
              </label>
              <input
                type="number"
                id="totalChapters"
                name="totalChapters"
                value={formData.totalChapters}
                onChange={handleChange}
                min="0"
                className="w-full px-5 py-2.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
              />
            </div>
            <div>
              <label htmlFor="currentChapter" className="block text-sm font-medium text-gray-700 mb-1">
                Capítulo Actual <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="currentChapter"
                name="currentChapter"
                value={formData.currentChapter}
                onChange={handleChange}
                required
                min="0"
                max={formData.totalChapters ? parseInt(formData.totalChapters) : undefined}
                className="w-full px-5 py-2.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="selectedState" className="block text-sm font-medium text-gray-700 mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                id="selectedState"
                name="selectedState"
                value={formData.selectedState}
                onChange={handleChange}
                required
                className="w-full px-5 py-2.5 border-2 border-gray-300 rounded-full bg-white appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
              >
                {STATES_VIEW_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-[65%] h-5 w-5 text-gray-400 transform -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <label htmlFor="selectedRating" className="block text-sm font-medium text-gray-700 mb-1">
                Calificación
              </label>
              <select
                id="selectedRating"
                name="selectedRating"
                value={formData.selectedRating}
                onChange={handleChange}
                className="w-full px-5 py-2.5 border-2 border-gray-300 rounded-full bg-white appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
              >
                <option value="">Seleccionar</option>
                {RATINGS_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.value}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-[65%] h-5 w-5 text-gray-400 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="selectedSeasonId" className="block text-sm font-medium text-gray-700 mb-1">
              Temporada de Estreno <span className="text-red-500">*</span>
            </label>
            <select
              id="selectedSeasonId"
              name="selectedSeasonId"
              value={formData.selectedSeasonId}
              onChange={handleChange}
              required
              className="w-full px-5 py-2.5 border-2 border-gray-300 rounded-full bg-white appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
            >
              {SEASONS_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-[65%] h-5 w-5 text-gray-400 transform -translate-y-1/2 pointer-events-none" />
          </div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="addReview"
              name="addReview"
              checked={formData.addReview}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="addReview" className="ml-2 block text-sm font-medium text-gray-700">
              ¿Agregar una reseña?
            </label>
          </div>

          {formData.addReview && (
            <div>
              <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 mb-1">
                Tu reseña
              </label>
              <textarea
                id="reviewText"
                name="reviewText"
                value={formData.reviewText}
                onChange={handleChange}
                rows={4}
                className="w-full px-5 py-2.5 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-inner"
                placeholder="Escribe tu reseña aquí..."
              ></textarea>
            </div>
          )}

          <div className='flex justify-center'>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-semibold text-white px-5 py-2.5 text-center rounded-full transition-all duration-300 shadow-md hover:shadow-lg
                ${isLoading
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300'
                }`}
            >
              {isLoading ? 'Añadiendo...' : 'Añadir Anime'}
            </button>
          </div>
        </form>
      </div>
    </div>

    {notification && (
      <NotificationToast
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(null)}
        duration={notification.type === 'error' ? 5000 : 4000} 
      />
    )}
  </>
);
};

export default AddAnimeModal;