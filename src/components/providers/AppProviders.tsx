import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { SessionActivityTracker } from '@/components/auth/SessionActivityTracker';
import { SessionWarning } from '@/components/auth/SessionWarning';
import { HiddenAdminAccess } from '@/components/system/HiddenAdminAccess';
import { PageLoading } from '@/components/ui/modern-loading';
import { useStoreInitialization } from '@/hooks/useStoreInitialization';
import { useGlobalLoading } from '@/stores/loadingStore';
import { AppInitializationScreen } from '@/components/initialization/AppInitializationScreen';

export function AppProviders() {
  const { isReady } = useStoreInitialization();
  const globalLoading = useGlobalLoading();

  // Show initialization screen while stores are initializing
  if (!isReady) {
    return <AppInitializationScreen />;
  }

  // Once initialized, render the main app with minimal providers
  return (
    <AnalyticsProvider>
      <SessionActivityTracker>
        <HiddenAdminAccess>
          <SessionWarning />

          {/* Global loading overlay */}
          {globalLoading.isLoading && globalLoading.loadingType === 'page' && (
            <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm">
              <PageLoading text={globalLoading.loadingText} />
            </div>
          )}

          <Suspense fallback={<PageLoading text="Loading application..." />}>
            <Outlet />
          </Suspense>
        </HiddenAdminAccess>
      </SessionActivityTracker>
    </AnalyticsProvider>
  );
}
