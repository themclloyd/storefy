import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from '@/lib/sessionManager';
import { useAuthStore } from './authStore';

interface Store {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  settings?: any;
  subscription_tier?: string;
  subscription_status?: string;
}

interface StoreState {
  stores: Store[];
  currentStore: Store | null;
  userRole: string | null;
  loading: boolean;
  initialized: boolean;
  isOwner: boolean;
  canManage: boolean;
  hasValidStoreSelection: boolean;
}

interface StoreActions {
  setStores: (stores: Store[]) => void;
  setCurrentStore: (store: Store | null) => void;
  setUserRole: (role: string | null) => void;
  setLoading: (loading: boolean) => void;
  selectStore: (storeId: string) => void;
  updateCurrentStore: (updatedStore: Partial<Store>) => void;
  refreshStores: () => Promise<void>;
  clearStoreSelection: () => void;
  initialize: () => Promise<void>;
}

type StoreStore = StoreState & StoreActions;

export const useStoreStore = create<StoreStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        stores: [],
        currentStore: null,
        userRole: null,
        loading: false,
        initialized: false,
        isOwner: false,
        canManage: false,
        hasValidStoreSelection: false,

        // Actions
        setStores: (stores) => set({ stores }, false, 'setStores'),
        
        setCurrentStore: (store) => {
          const state = get();
          const isOwner = store ? store.owner_id === useAuthStore.getState().user?.id : false;
          const canManage = isOwner || (state.userRole && ['owner', 'manager'].includes(state.userRole));
          
          set({ 
            currentStore: store,
            isOwner,
            canManage,
            hasValidStoreSelection: Boolean(store)
          }, false, 'setCurrentStore');
        },
        
        setUserRole: (role) => {
          const state = get();
          const canManage = state.isOwner || (role && ['owner', 'manager'].includes(role));
          set({ userRole: role, canManage }, false, 'setUserRole');
        },
        
        setLoading: (loading) => set({ loading }, false, 'setLoading'),

        selectStore: (storeId) => {
          const state = get();
          const store = state.stores.find(s => s.id === storeId);
          if (store) {
            get().setCurrentStore(store);
            
            // Persist selection
            localStorage.setItem('storefy_selected_store', storeId);
            
            console.log('🏪 Store selected:', store.name);
          }
        },

        updateCurrentStore: (updatedStore) => {
          const state = get();
          if (state.currentStore) {
            const updated = { ...state.currentStore, ...updatedStore };
            set({ currentStore: updated }, false, 'updateCurrentStore');
            
            // Update in stores array
            const updatedStores = state.stores.map(store => 
              store.id === updated.id ? updated : store
            );
            set({ stores: updatedStores }, false, 'updateStoresArray');
          }
        },

        refreshStores: async () => {
          try {
            set({ loading: true }, false, 'refreshStores:start');
            
            const user = useAuthStore.getState().user;
            if (!user) {
              set({ stores: [], loading: false }, false, 'refreshStores:noUser');
              return;
            }

            const { data: stores, error } = await supabase
              .from('stores')
              .select('*')
              .eq('owner_id', user.id);

            if (error) throw error;

            set({ stores: stores || [], loading: false }, false, 'refreshStores:success');
          } catch (error) {
            console.error('Error refreshing stores:', error);
            set({ loading: false }, false, 'refreshStores:error');
          }
        },

        clearStoreSelection: () => {
          localStorage.removeItem('storefy_selected_store');
          set({ 
            currentStore: null,
            userRole: null,
            isOwner: false,
            canManage: false,
            hasValidStoreSelection: false
          }, false, 'clearStoreSelection');
        },

        initialize: async () => {
          try {
            set({ loading: true, initialized: false }, false, 'initialize:start');
            
            const user = useAuthStore.getState().user;
            const pinData = sessionManager.getPinSession();
            
            // Handle PIN session
            if (pinData && !user) {
              const store = pinData.store;
              if (store) {
                set({
                  stores: [store],
                  currentStore: store,
                  userRole: 'cashier',
                  isOwner: false,
                  canManage: false,
                  hasValidStoreSelection: true,
                  loading: false,
                  initialized: true
                }, false, 'initialize:pinSession');
                return;
              }
            }
            
            // Handle regular user session
            if (user) {
              await get().refreshStores();
              
              // Try to restore last selected store
              const lastStoreId = localStorage.getItem('storefy_selected_store');
              if (lastStoreId) {
                const state = get();
                const store = state.stores.find(s => s.id === lastStoreId);
                if (store) {
                  get().setCurrentStore(store);
                }
              }
            }
            
            set({ initialized: true }, false, 'initialize:complete');
          } catch (error) {
            console.error('Store initialization failed:', error);
            set({ 
              loading: false, 
              initialized: true 
            }, false, 'initialize:error');
          }
        },
      }),
      {
        name: 'store-store',
        partialize: (state) => ({
          // Only persist store selection
          currentStore: state.currentStore ? { id: state.currentStore.id } : null,
        }),
      }
    ),
    {
      name: 'store-store',
    }
  )
);

// Selectors for optimized re-renders
export const useStores = () => useStoreStore((state) => state.stores);
export const useCurrentStore = () => useStoreStore((state) => state.currentStore);
export const useUserRole = () => useStoreStore((state) => state.userRole);
export const useStoreLoading = () => useStoreStore((state) => state.loading);
export const useIsOwner = () => useStoreStore((state) => state.isOwner);
export const useCanManage = () => useStoreStore((state) => state.canManage);
export const useHasValidStoreSelection = () => useStoreStore((state) => state.hasValidStoreSelection);

// Action selectors
export const useStoreActions = () => useStoreStore((state) => ({
  selectStore: state.selectStore,
  updateCurrentStore: state.updateCurrentStore,
  refreshStores: state.refreshStores,
  clearStoreSelection: state.clearStoreSelection,
  initialize: state.initialize,
}));
