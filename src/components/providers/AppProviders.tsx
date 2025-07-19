import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { SessionActivityTracker } from '@/components/auth/SessionActivityTracker';
import { SessionWarning } from '@/components/auth/SessionWarning';
import { HiddenAdminAccess } from '@/components/system/HiddenAdminAccess';
import { PageLoading } from '@/components/ui/modern-loading';
import { useStoreInitialization } from '@/hooks/useStoreInitialization';

export function AppProviders() {
  const { isReady } = useStoreInitialization();

  // Initialize stores but don't block rendering
  useEffect(() => {
    // Stores will initialize in the background
  }, []);

  // Always render the main app - let individual components handle their own loading states
  return (
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
  );
}
