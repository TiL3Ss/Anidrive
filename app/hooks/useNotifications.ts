// hooks/useNotifications.ts
import { useState } from 'react';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useNotifications = () => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    clearNotification
  };
};