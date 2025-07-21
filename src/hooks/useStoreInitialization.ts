import { useEffect } from 'react';
import { useAuthStore, useAuthInitialized, useUser } from '@/stores/authStore';
import { useStoreStore, useRefreshStores, useSelectStore } from '@/stores/storeStore';
import { usePermissionStore } from '@/stores/permissionStore';

/**
 * Simplified store initialization - directly load stores when user is ready
 */
export function useStoreInitialization() {
  const authInitialized = useAuthInitialized();
  const authInitialize = useAuthStore((state) => state.initialize);
  const user = useUser();

  const stores = useStoreStore((state) => state.stores);
  const currentStore = useStoreStore((state) => state.currentStore);
  const storeInitialized = useStoreStore((state) => state.initialized);
  const refreshStores = useRefreshStores();
  const selectStore = useSelectStore();

  const permissionInitialize = usePermissionStore((state) => state.loadPermissions);
  const permissionInitialized = usePermissionStore((state) => state.initialized);

  // Initialize auth first
  useEffect(() => {
    let authCleanup: (() => void) | undefined;

    const initializeAuth = async () => {
      authCleanup = await authInitialize();
    };

    initializeAuth();

    return () => {
      if (authCleanup) {
        authCleanup();
      }
    };
  }, [authInitialize]);

  // Load stores directly when user is ready
  useEffect(() => {
    const loadStores = async () => {
      if (authInitialized && user && stores.length === 0) {
        await refreshStores();

        // Try to restore last selected store
        const storedSelection = localStorage.getItem('storefy_selected_store');
        if (storedSelection) {
          try {
            let storeId: string;
            if (storedSelection.startsWith('{')) {
              const parsed = JSON.parse(storedSelection);
              storeId = parsed.storeId;
              if (parsed.userId !== user.id) {
                console.log('❌ Stored selection belongs to different user, clearing');
                localStorage.removeItem('storefy_selected_store');
                return;
              }
            } else {
              storeId = storedSelection;
            }

            const state = useStoreStore.getState();
            const store = state.stores.find(s => s.id === storeId);
            if (store) {
              selectStore(store.id);
              return;
            }
          } catch (error) {
            console.error('Error restoring store selection:', error);
            localStorage.removeItem('storefy_selected_store');
          }
        }

        // Auto-select single store if no restoration
        const state = useStoreStore.getState();
        if (state.stores.length === 1 && !state.currentStore) {
          selectStore(state.stores[0].id);
        }
      }
    };

    loadStores();
  }, [authInitialized, user, stores.length, refreshStores, selectStore]);

  // Initialize permissions when user is ready
  useEffect(() => {
    if (authInitialized && user && !permissionInitialized) {
      console.log('🔐 Initializing permissions for user:', user.email);
      permissionInitialize();
    }
  }, [authInitialized, user, permissionInitialized, permissionInitialize]);

  // Refresh permissions when store changes
  useEffect(() => {
    if (authInitialized && user && permissionInitialized) {
      console.log('🔐 Store changed, refreshing permissions for:', currentStore?.name || 'no store');
      permissionInitialize();
    }
  }, [currentStore?.id, authInitialized, user, permissionInitialized, permissionInitialize]);

  return {
    isReady: authInitialized && storeInitialized && permissionInitialized,
    authInitialized,
    storeInitialized,
    permissionInitialized,
  };
}
