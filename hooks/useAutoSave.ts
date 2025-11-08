import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  storageKey: string;
  interval?: number; // Intervalo en milisegundos (default: 30000 = 30 segundos)
  enabled?: boolean;
}

export function useAutoSave({ data, onSave, storageKey, interval = 30000, enabled = true }: UseAutoSaveOptions) {
  const lastSavedRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const dataStringRef = useRef<string>('');

  // Guardar en localStorage como backup
  const saveToLocalStorage = useCallback((dataToSave: any) => {
    try {
      const dataString = JSON.stringify(dataToSave);
      localStorage.setItem(storageKey, dataString);
      localStorage.setItem(`${storageKey}_timestamp`, new Date().toISOString());
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [storageKey]);

  // Cargar desde localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  }, [storageKey]);

  // Función de guardado automático
  const performAutoSave = useCallback(async (dataToSave: any, showToast = false) => {
    if (isSavingRef.current) return;
    
    const dataString = JSON.stringify(dataToSave);
    if (dataString === lastSavedRef.current) return; // No hay cambios
    
    isSavingRef.current = true;
    dataStringRef.current = dataString;

    try {
      // Guardar en localStorage primero (rápido)
      saveToLocalStorage(dataToSave);
      
      // Guardar en base de datos
      await onSave(dataToSave);
      
      lastSavedRef.current = dataString;
      
      if (showToast) {
        toast.success('Guardado automático', { duration: 2000, icon: '💾' });
      }
    } catch (error) {
      console.error('Error in auto-save:', error);
      // No mostrar error al usuario en auto-guardado silencioso
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, saveToLocalStorage]);

  // Auto-guardado periódico
  useEffect(() => {
    if (!enabled) return;

    const scheduleSave = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        performAutoSave(data, false);
      }, interval);
    };

    scheduleSave();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, interval, enabled, performAutoSave]);

  // Guardar antes de cerrar la página
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Intentar guardar de forma síncrona si es posible
      const dataString = JSON.stringify(data);
      if (dataString !== lastSavedRef.current) {
        // Guardar en localStorage como último recurso
        saveToLocalStorage(data);
        
        // Intentar guardar con sendBeacon (más confiable que fetch)
        try {
          const blob = new Blob([dataString], { type: 'application/json' });
          navigator.sendBeacon('/api/auto-save', blob);
        } catch (error) {
          console.error('Error with sendBeacon:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Guardar cuando la pestaña se oculta
        performAutoSave(data, false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [data, enabled, performAutoSave, saveToLocalStorage]);

  // Función para guardar manualmente
  const manualSave = useCallback(async () => {
    await performAutoSave(data, true);
  }, [data, performAutoSave]);

  // Función para restaurar desde localStorage
  const restoreFromLocalStorage = useCallback(() => {
    return loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  return {
    manualSave,
    restoreFromLocalStorage,
    isSaving: isSavingRef.current,
  };
}

