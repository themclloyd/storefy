import React, { lazy, Suspense } from 'react';
import { useGlobalLoading } from '@/stores/loadingStore';

// Dynamically import PageLoading to avoid circular dependency
const PageLoading = lazy(() =>
  import('@/components/ui/modern-loading').then(module => ({
    default: module.PageLoading
  }))
);

/**
 * Global Loading Overlay Component
 * 
 * Displays a full-screen loading overlay when global page loading is active.
 * Uses the Zustand loading store to manage state.
 */
export function GlobalLoadingOverlay() {
  const { isLoading, loadingText, loadingType } = useGlobalLoading();
  
  // Only show overlay for page-level loading
  if (!isLoading || loadingType !== 'page') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <PageLoading text={loadingText} />
      </Suspense>
    </div>
  );
}
