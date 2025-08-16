// components/DELAnimeModal.tsx
import { useState } from 'react';
import Image from 'next/image';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'; 


interface Anime {
  id: number;
  name: string;
  image_url: string;
}

interface DELAnimeModalProps {
  anime: Anime;
  onClose: () => void;
  onDelete: (animeId: number) => Promise<void>;
}

export default function DELAnimeModal({ anime, onClose, onDelete }: DELAnimeModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete(anime.id);
      onClose();
    } catch (err) {
      setError('Error al eliminar el anime. Por favor intenta nuevamente.');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

 return (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full relative mx-4">
        <h2 className="text-2xl font-bold mb-4 text-center text-red-600">Eliminar Anime</h2>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors duration-200 rounded-full p-1 hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="space-y-5">
          <div className="text-center">
            <p className="text-gray-600 mb-5">¿Estás seguro que deseas eliminar este anime de tu colección?</p>
            
            <div className="flex justify-center">
              <div className="relative h-40 w-40 rounded-full overflow-hidden mb-4 border-2 border-gray-200">
                <Image
                  src={anime.image_url}
                  alt={anime.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
           
            <p className="font-semibold text-lg text-gray-900 mt-2 px-2 line-clamp-2">{anime.name}</p>
          </div>

          {error && (
            <p className="text-center text-sm text-red-500 bg-red-50 py-2 px-3 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 font-medium text-gray-700 text-sm px-4 py-2.5 text-center rounded-full transition duration-300 ease-in-out border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-70"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`flex-1 font-medium text-white text-sm px-4 py-2.5 text-center rounded-full transition duration-300 ease-in-out
                ${isDeleting
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-300 focus:ring-offset-2'
                }`}
            >
              {isDeleting ? (
                <span className="flex items-center justify-center">
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Eliminando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Eliminar
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

}