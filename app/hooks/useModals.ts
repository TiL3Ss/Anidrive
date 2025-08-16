// hooks/useModals.ts
import { useState } from 'react';

export const useModals = () => {
  const [showAddAnimeModal, setShowAddAnimeModal] = useState(false);
  const [showEditAnimeModal, setShowEditAnimeModal] = useState(false);
  const [showDelAnimeModal, setShowDelAnimeModal] = useState(false);
  const [showSearchAnimeModal, setShowSearchAnimeModal] = useState(false);

  const closeAllModals = () => {
    setShowAddAnimeModal(false);
    setShowEditAnimeModal(false);
    setShowDelAnimeModal(false);
    setShowSearchAnimeModal(false);
  };

  return {
    showAddAnimeModal,
    setShowAddAnimeModal,
    showEditAnimeModal,
    setShowEditAnimeModal,
    showDelAnimeModal,
    setShowDelAnimeModal,
    showSearchAnimeModal,
    setShowSearchAnimeModal,
    closeAllModals
  };
};