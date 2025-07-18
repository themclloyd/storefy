import { useEffect } from 'react';
import { useAuthStore, useAuthInitialized } from '@/stores/authStore';
import { useStoreStore } from '@/stores/storeStore';

/**
 * Hook to initialize all Zustand stores
 * This replaces the complex provider chain with simple store initialization
 */
export function useStoreInitialization() {
  const authInitialized = useAuthInitialized();
  const authInitialize = useAuthStore((state) => state.initialize);
  const storeInitialize = useStoreStore((state) => state.initialize);
  const storeInitialized = useStoreStore((state) => state.initialized);

  useEffect(() => {
    // Initialize auth store first
    let authCleanup: (() => void) | undefined;
    
    const initializeAuth = async () => {
      authCleanup = await authInitialize();
    };
    
    initializeAuth();

    // Cleanup auth listener on unmount
    return () => {
      if (authCleanup) {
        authCleanup();
      }
    };
  }, [authInitialize]);

  useEffect(() => {
    // Initialize store after auth is ready
    if (authInitialized && !storeInitialized) {
      storeInitialize();
    }
  }, [authInitialized, storeInitialized, storeInitialize]);

  return {
    isReady: authInitialized && storeInitialized,
    authInitialized,
    storeInitialized,
  };
}
