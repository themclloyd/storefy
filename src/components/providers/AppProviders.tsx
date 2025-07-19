import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { SessionActivityTracker } from '@/components/auth/SessionActivityTracker';
import { SessionWarning } from '@/components/auth/SessionWarning';
import { HiddenAdminAccess } from '@/components/system/HiddenAdminAccess';
import { PageLoading } from '@/components/ui/modern-loading';
import { useStoreInitialization } from '@/hooks/useStoreInitialization';
import { useGlobalLoading } from '@/stores/loadingStore';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { StoreProvider } from '@/contexts/StoreContext';
import { AppInitializationScreen } from '@/components/initialization/AppInitializationScreen';

export function AppProviders() {
  const { isReady } = useStoreInitialization();

  // Show initialization screen while stores are initializing
  if (!isReady) {
    return <AppInitializationScreen />;
  }

  // Once initialized, render the main app with minimal providers
  return (
    <StoreProvider>
      <PermissionProvider>
        <AnalyticsProvider>
          <SessionActivityTracker>
            <HiddenAdminAccess>
              <SessionWarning />
              <Suspense fallback={<PageLoading text="Loading application..." />}>
                <Outlet />
              </Suspense>
            </HiddenAdminAccess>
          </SessionActivityTracker>
        </AnalyticsProvider>
      </PermissionProvider>
    </StoreProvider>
  );
}
