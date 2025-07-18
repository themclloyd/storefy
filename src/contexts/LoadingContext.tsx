import React, { createContext, useContext, useState, useCallback } from 'react';
import { PageLoading } from '@/components/ui/modern-loading';

interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  loadingType?: 'page' | 'component' | 'action';
  priority?: number; // Higher priority loading states override lower ones
}

interface LoadingContextType {
  globalLoading: LoadingState;
  setGlobalLoading: (loading: LoadingState | null) => void;
  setPageLoading: (loading: boolean, text?: string) => void;
  setComponentLoading: (loading: boolean, text?: string) => void;
  setActionLoading: (loading: boolean, text?: string) => void;
  clearLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [globalLoading, setGlobalLoadingState] = useState<LoadingState>({
    isLoading: false,
    priority: 0
  });

  const setGlobalLoading = useCallback((loading: LoadingState | null) => {
    if (!loading) {
      setGlobalLoadingState({ isLoading: false, priority: 0 });
      return;
    }

    // Only update if the new loading state has higher or equal priority
    setGlobalLoadingState(prev => {
      if (!prev.isLoading || (loading.priority || 0) >= (prev.priority || 0)) {
        return loading;
      }
      return prev;
    });
  }, []);

  const setPageLoading = useCallback((loading: boolean, text?: string) => {
    setGlobalLoading(loading ? {
      isLoading: true,
      loadingText: text || 'Loading...',
      loadingType: 'page',
      priority: 3 // Highest priority
    } : null);
  }, [setGlobalLoading]);

  const setComponentLoading = useCallback((loading: boolean, text?: string) => {
    setGlobalLoading(loading ? {
      isLoading: true,
      loadingText: text || 'Loading...',
      loadingType: 'component',
      priority: 2 // Medium priority
    } : null);
  }, [setGlobalLoading]);

  const setActionLoading = useCallback((loading: boolean, text?: string) => {
    setGlobalLoading(loading ? {
      isLoading: true,
      loadingText: text || 'Loading...',
      loadingType: 'action',
      priority: 1 // Lowest priority
    } : null);
  }, [setGlobalLoading]);

  const clearLoading = useCallback(() => {
    setGlobalLoadingState({ isLoading: false, priority: 0 });
  }, []);

  const value = {
    globalLoading,
    setGlobalLoading,
    setPageLoading,
    setComponentLoading,
    setActionLoading,
    clearLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {/* Global loading overlay */}
      {globalLoading.isLoading && globalLoading.loadingType === 'page' && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm">
          <PageLoading text={globalLoading.loadingText} />
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Hook for page-level loading
export function usePageLoading() {
  const { setPageLoading } = useLoading();
  return setPageLoading;
}

// Hook for component-level loading
export function useComponentLoading() {
  const { setComponentLoading } = useLoading();
  return setComponentLoading;
}

// Hook for action-level loading (buttons, forms, etc.)
export function useActionLoading() {
  const { setActionLoading } = useLoading();
  return setActionLoading;
}
