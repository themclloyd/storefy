import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  loadingType?: 'page' | 'component' | 'action';
  priority?: number; // Higher priority loading states override lower ones
}

interface LoadingStore extends LoadingState {
  setGlobalLoading: (loading: LoadingState | null) => void;
  setPageLoading: (loading: boolean, text?: string) => void;
  setComponentLoading: (loading: boolean, text?: string) => void;
  setActionLoading: (loading: boolean, text?: string) => void;
  clearLoading: () => void;
}

export const useLoadingStore = create<LoadingStore>()(
  devtools(
    (set, get) => ({
      // State
      isLoading: false,
      loadingText: undefined,
      loadingType: undefined,
      priority: 0,

      // Actions
      setGlobalLoading: (loading) => {
        if (!loading) {
          set({ 
            isLoading: false, 
            loadingText: undefined, 
            loadingType: undefined, 
            priority: 0 
          }, false, 'clearGlobalLoading');
          return;
        }

        const currentState = get();
        
        // Only update if the new loading state has higher or equal priority
        if (!currentState.isLoading || (loading.priority || 0) >= (currentState.priority || 0)) {
          set({
            isLoading: loading.isLoading,
            loadingText: loading.loadingText,
            loadingType: loading.loadingType,
            priority: loading.priority || 0
          }, false, 'setGlobalLoading');
        }
      },

      setPageLoading: (loading, text) => {
        const state = get();
        state.setGlobalLoading(loading ? {
          isLoading: true,
          loadingText: text || 'Loading...',
          loadingType: 'page',
          priority: 3 // Highest priority
        } : null);
      },

      setComponentLoading: (loading, text) => {
        const state = get();
        state.setGlobalLoading(loading ? {
          isLoading: true,
          loadingText: text || 'Loading...',
          loadingType: 'component',
          priority: 2 // Medium priority
        } : null);
      },

      setActionLoading: (loading, text) => {
        const state = get();
        state.setGlobalLoading(loading ? {
          isLoading: true,
          loadingText: text || 'Loading...',
          loadingType: 'action',
          priority: 1 // Lowest priority
        } : null);
      },

      clearLoading: () => {
        set({ 
          isLoading: false, 
          loadingText: undefined, 
          loadingType: undefined, 
          priority: 0 
        }, false, 'clearLoading');
      },
    }),
    {
      name: 'loading-store',
    }
  )
);

// Selectors for optimized re-renders
export const useGlobalLoading = () => useLoadingStore((state) => ({
  isLoading: state.isLoading,
  loadingText: state.loadingText,
  loadingType: state.loadingType,
}));

export const useIsLoading = () => useLoadingStore((state) => state.isLoading);
export const useLoadingText = () => useLoadingStore((state) => state.loadingText);

// Action selectors
export const useLoadingActions = () => useLoadingStore((state) => ({
  setPageLoading: state.setPageLoading,
  setComponentLoading: state.setComponentLoading,
  setActionLoading: state.setActionLoading,
  clearLoading: state.clearLoading,
}));

// Hook aliases for backward compatibility
export const usePageLoading = () => useLoadingStore((state) => state.setPageLoading);
export const useComponentLoading = () => useLoadingStore((state) => state.setComponentLoading);
export const useActionLoading = () => useLoadingStore((state) => state.setActionLoading);
