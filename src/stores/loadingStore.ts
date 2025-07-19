import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import React from 'react';

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

// Selectors for optimized re-renders with proper memoization
export const useGlobalLoading = () => {
  return useLoadingStore((state) => ({
    isLoading: state.isLoading,
    loadingText: state.loadingText,
    loadingType: state.loadingType,
  }), (a, b) => a.isLoading === b.isLoading && a.loadingText === b.loadingText && a.loadingType === b.loadingType);
};

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

// Global Loading Overlay Component
export function GlobalLoadingOverlay() {
  const { isLoading, loadingText, loadingType } = useGlobalLoading();

  if (!isLoading || loadingType !== 'page') {
    return null;
  }

  // Dynamically import PageLoading to avoid circular dependency
  const PageLoading = React.lazy(() =>
    import('@/components/ui/modern-loading').then(module => ({
      default: module.PageLoading
    }))
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm">
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <PageLoading text={loadingText} />
      </React.Suspense>
    </div>
  );
}
