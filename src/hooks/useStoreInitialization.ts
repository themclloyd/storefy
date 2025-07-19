import { useEffect } from 'react';
import { useAuthStore, useAuthInitialized } from '@/stores/authStore';
import { useStoreStore } from '@/stores/storeStore';
import { usePermissionStore } from '@/stores/permissionStore';

/**
 * Hook to initialize all Zustand stores
 * This replaces the complex provider chain with simple store initialization
 */
export function useStoreInitialization() {
  const authInitialized = useAuthInitialized();
  const authInitialize = useAuthStore((state) => state.initialize);
  const storeInitialize = useStoreStore((state) => state.initialize);
  const storeInitialized = useStoreStore((state) => state.initialized);
  const currentStore = useStoreStore((state) => state.currentStore);
  const permissionInitialize = usePermissionStore((state) => state.loadPermissions);
  const permissionInitialized = usePermissionStore((state) => state.initialized);

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

  useEffect(() => {
    // Initialize permissions after both auth and store are ready
    // Wait for store initialization to complete (which includes store restoration)
    if (authInitialized && storeInitialized && !permissionInitialized) {
      console.log('🔐 Initializing permissions after auth and store are ready');
      console.log('🔐 Current store when initializing permissions:', currentStore?.name || 'none');
      permissionInitialize();
    }
  }, [authInitialized, storeInitialized, permissionInitialized, permissionInitialize, currentStore]);

  // Refresh permissions when store changes (after initial load)
  useEffect(() => {
    if (authInitialized && storeInitialized && permissionInitialized && currentStore) {
      console.log('🔐 Store changed, refreshing permissions for:', currentStore.name);
      permissionInitialize();
    }
  }, [currentStore?.id, authInitialized, storeInitialized, permissionInitialized, permissionInitialize]);

  return {
    isReady: authInitialized && storeInitialized && permissionInitialized,
    authInitialized,
    storeInitialized,
    permissionInitialized,
  };
}
