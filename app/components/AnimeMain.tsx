import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Anime_Comments from './Anime_Comments'; // Asumiendo que esta es la ruta correcta

interface Anime {
  id: string;
  title: string;
  imageUrl?: string;
  currentEpisode?: number;
  totalChapters?: number;
  state_name?: string;
  rating?: number;
  seasonCour?: string;
  year?: number;
  seasonName?: string;
  review?: string; // Para la review cargada del anime en el perfil
}

interface AnimeMainProps {
  selectedAnime: Anime;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReviewUpdate?: (newReview: string | null) => void;
  username: string;
  backToSeason?: boolean;
  isOwnProfile: boolean;
  profileUserId: string;
  currentUserId: string;
}

const AnimeMain: React.FC<AnimeMainProps> = ({ 
  selectedAnime, 
  onBack,
  onEdit, 
  onDelete,
  onReviewUpdate,
  username,
  backToSeason = true,
  isOwnProfile,
  profileUserId,
  currentUserId
}) => {
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);
  const [currentReview, setCurrentReview] = useState<string | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(true);

  // Cargar la review desde la base de datos al montar el componente
  useEffect(() => {
    const loadReview = async () => {
      try {
        setIsLoadingReview(true);
        
        // Construir la URL de la API con parámetros apropiados
        const url = isOwnProfile 
          ? `/api/user/animes/review?animeId=${selectedAnime.id}`
          : `/api/user/animes/review?animeId=${selectedAnime.id}&userId=${profileUserId}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setCurrentReview(data.review);
          setReviewText(data.review || '');
        } else if (response.status === 404) {
          // El anime no existe para este usuario, usar valores por defecto
          setCurrentReview(null);
          setReviewText('');
        } else {
          console.error('Error al cargar review');
          // En caso de error, usar la review del prop como fallback
          setCurrentReview(selectedAnime.review);
          setReviewText(selectedAnime.review || '');
        }
      } catch (error) {
        console.error('Error de red al cargar review:', error);
        // En caso de error, usar la review del prop como fallback
        setCurrentReview(selectedAnime.review);
        setReviewText(selectedAnime.review || '');
      } finally {
        setIsLoadingReview(false);
      }
    };

    loadReview();
  }, [selectedAnime.id, selectedAnime.review, isOwnProfile, profileUserId]);

  const handleEditReview = () => {
    setReviewText(currentReview || '');
    setIsEditingReview(true);
  };

  const handleCancelEditReview = () => {
    setReviewText(currentReview || '');
    setIsEditingReview(false);
  };

  const handleSaveReview = async () => {
    setIsUpdatingReview(true);
    
    try {
      const response = await fetch('/api/user/animes/update-review', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animeId: selectedAnime.id,
          review: reviewText.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newReview = data.review;
        setCurrentReview(newReview);
        setIsEditingReview(false);
        
        // Notificar al componente padre sobre la actualización
        if (onReviewUpdate) {
          onReviewUpdate(newReview);
        }
      } else {
        const errorData = await response.json();
        console.error('Error al actualizar review:', errorData.message);
        // Usar un modal o toast en lugar de alert()
        // alert('Error al actualizar la review: ' + errorData.message); 
      }
    } catch (error) {
      console.error('Error de red al actualizar review:', error);
      // Usar un modal o toast en lugar de alert()
      // alert('Error de conexión al actualizar la review');
    } finally {
      setIsUpdatingReview(false);
    }
  };

  return (
    <div className="relative p-4 bg-gray-50 min-h-screen">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 z-10"
        aria-label={backToSeason ? "Volver a la temporada" : "Volver al drive"}
        title={backToSeason ? "Volver a la temporada" : "Volver al drive"}
      >
        <ArrowLeftIcon className="h-6 w-6" />
      </button>

      {/* Contenedor principal del contenido del anime */}
      <div className="bg-white rounded-[2rem] shadow-xl p-6 md:p-8 mt-12 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sección de la Imagen */}
          <div className="relative flex-shrink-0 w-full md:w-64 h-64 md:h-80">
            <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-md relative">
              <img
                src={selectedAnime.imageUrl || '/default-anime-image.jpg'}
                alt={selectedAnime.title}
                className="w-full h-full object-cover"
              />
              
              {/* Botones de Acción - Solo mostrar si es el perfil propio */}
              {isOwnProfile && (
                <div className="absolute top-2 right-2 flex gap-2">
                  {/* Botón de Editar */}
                  <button
                    onClick={onEdit}
                    className="bg-yellow-500 text-white p-2 rounded-full shadow-md hover:bg-yellow-600 transition duration-300"
                    aria-label="Editar Anime"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Botón de Eliminar */}
                  <button
                    onClick={onDelete}
                    className="bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition duration-300"
                    aria-label="Eliminar Anime"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Título */}
            <div className="absolute -mb-3 -mr-5 bottom-0 right-0 bg-blue-600 bg-opacity-70 text-white px-4 py-2 rounded-full text-lg font-semibold truncate max-w-full">
              {selectedAnime.title}
            </div>
          </div>

          {/* Información del Anime */}
          <div className="flex-grow">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 hidden md:block">{selectedAnime.title}</h2> 
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-gray-700 text-lg">
              <p>
                <span className="font-semibold">Episodio Actual:</span> {selectedAnime.currentEpisode || 'N/A'} / {selectedAnime.totalChapters || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Estado:</span> {selectedAnime.state_name || '???'}
              </p>
              <p>
                <span className="font-semibold">Calificación:</span> {selectedAnime.rating || 'No calificado'}
              </p>
              <p>
                <span className="font-semibold">Temporada/Cour:</span> {selectedAnime.seasonCour || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Año:</span> {selectedAnime.year || 'N/A'}
              </p>
              <p className="col-span-1 sm:col-span-2">
                <span className="font-semibold">Temporada de Estreno:</span> {selectedAnime.seasonName || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Comentario/Reseña */}
        <hr className="my-8 border-gray-200" />
        <div className="text-center bg-gray-100 p-6 rounded-[2rem] shadow-inner mb-8">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800">
              {isOwnProfile ? 'Tu Reseña' : `Reseña de ${username}`}
            </h3>
            {/* Botón de editar reseña - Solo mostrar si es el perfil propio */}
            {isOwnProfile && !isEditingReview && !isLoadingReview && (
              <button
                onClick={handleEditReview}
                className="ml-3 bg-blue-500 text-white p-2 rounded-full shadow-md hover:bg-blue-600 transition duration-300"
                aria-label="Editar Reseña"
                title="Editar Reseña"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Solo permitir edición si es el perfil propio */}
          {isEditingReview && isOwnProfile ? (
            <div className="space-y-4 text-gray-700">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Escribe tu reseña sobre este anime..."
                className="w-full h-32 p-3 border border-gray-300 rounded-[2rem] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={1000}
              />
              <div className="text-sm text-gray-500 text-right">
                {reviewText.length}/1000 caracteres
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleSaveReview}
                  disabled={isUpdatingReview}
                  className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  <CheckIcon className="h-4 w-4" />
                  {isUpdatingReview ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancelEditReview}
                  disabled={isUpdatingReview}
                  className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              {isLoadingReview ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-500">Cargando reseña...</span>
                </div>
              ) : (
                <>
                  {currentReview ? (
                    <p className="text-gray-700 italic leading-relaxed">"{currentReview}"</p>
                  ) : (
                    <p className="text-gray-500">
                      <span className="font-semibold">{username}</span> no escribió reseña sobre <span className="font-semibold">{selectedAnime.title}</span>.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Sección de Comentarios de Otros Usuarios */}
        <hr className="my-8 border-gray-200" />
        <Anime_Comments
          userId={profileUserId || currentUserId}
          animeId={selectedAnime.id}
          animeTitle={selectedAnime.title}
          isOwnProfile={isOwnProfile}
          currentUserId={currentUserId}
        />
      </div>
    </div> // <--- ESTA ES LA ETIQUETA </div> QUE FALTABA
  );
};

export default AnimeMain; // Asegúrate de exportar tu componente