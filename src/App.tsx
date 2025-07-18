import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { initializeSecurity } from "@/middleware/security";
import { initializePerformanceMonitoring } from "@/utils/performance";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppInitializationProvider } from "@/contexts/AppInitializationContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SessionWarning } from "@/components/auth/SessionWarning";
import { SessionActivityTracker } from "@/components/auth/SessionActivityTracker";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { initializeSessionMonitoring } from "@/lib/authUtils";
import { AppInitializationScreen } from "@/components/initialization/AppInitializationScreen";
import { useWaitForInitialization } from "@/contexts/AppInitializationContext";
import { PageLoading } from "@/components/ui/modern-loading";
import { HiddenAdminAccess } from "@/components/system/HiddenAdminAccess";

// Lazy load page components
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const PinLoginPage = lazy(() => import("./pages/PinLoginPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));

const StoreShortLinkPage = lazy(() => import("./pages/StoreShortLinkPage"));
const StoreSelectionPage = lazy(() => import("./pages/StoreSelectionPage"));
const SystemManagementView = lazy(() => import("./components/system/SystemManagementView").then(module => ({ default: module.SystemManagementView })));
const PublicStoreShowcase = lazy(() => import("./components/showcase/PublicStoreShowcase").then(module => ({ default: module.PublicStoreShowcase })));

const NotFound = lazy(() => import("./pages/NotFound"));


// Loading component for page-level Suspense
const PageLoader = () => <PageLoading text="Loading page..." />;

const queryClient = new QueryClient();

// Main app content that waits for initialization
function AppContent() {
  const { shouldWait } = useWaitForInitialization();

  // Show initialization screen while waiting
  if (shouldWait) {
    return <AppInitializationScreen />;
  }

  // Once initialized, render the main app
  return (
    <LoadingProvider>
      <StoreProvider>
        <PermissionProvider>
          <AnalyticsProvider>
            <SessionActivityTracker>
              <HiddenAdminAccess>
                <SessionWarning />
                <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<ProtectedRoute requiredPage="dashboard"><Index activeView="dashboard" /></ProtectedRoute>} />
                <Route path="/pos" element={<ProtectedRoute requiredPage="pos"><Index activeView="pos" /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute requiredPage="inventory"><Index activeView="inventory" /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute requiredPage="categories"><Index activeView="categories" /></ProtectedRoute>} />
                <Route path="/suppliers" element={<ProtectedRoute requiredPage="suppliers"><Index activeView="suppliers" /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute requiredPage="customers"><Index activeView="customers" /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Index activeView="dashboard" /></ProtectedRoute>} />
                <Route path="/layby" element={<ProtectedRoute requiredPage="layby"><Index activeView="layby" /></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute requiredPage="transactions"><Index activeView="transactions" /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute requiredPage="reports"><Index activeView="reports" /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute requiredPage="expenses"><Index activeView="expenses" /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute requiredPage="analytics"><Index activeView="analytics" /></ProtectedRoute>} />
                <Route path="/showcase" element={<ProtectedRoute requiredPage="showcase"><Index activeView="showcase" /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute requiredPage="settings"><Index activeView="settings" /></ProtectedRoute>} />
                <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
                <Route path="/payment-result" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
                <Route path="/stores" element={<StoreSelectionPage />} />
                <Route path="/system" element={<SystemManagementView />} />
                <Route path="/app" element={<ProtectedRoute><Index activeView="dashboard" /></ProtectedRoute>} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/pin-login" element={<PinLoginPage />} />
                <Route path="/store/:storeCode" element={<StoreShortLinkPage />} />
                <Route path="/showcase/:storeId" element={<PublicStoreShowcase />} />
                <Route path="/store/:storeCode/catalog" element={<PublicStoreShowcase />} />
                <Route path="/shop/:storeSlug" element={<PublicStoreShowcase />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </HiddenAdminAccess>
          </SessionActivityTracker>
        </AnalyticsProvider>
      </PermissionProvider>
    </StoreProvider>
    </LoadingProvider>
  );
}

const App = () => {
  // Initialize session monitoring on app start
  useEffect(() => {
    initializeSessionMonitoring();

    // Load session testing utilities in development
    if (import.meta.env.DEV) {
      import('@/utils/sessionTest').then(() => {
        console.log('🔧 Session testing utilities loaded. Use window.sessionTest in console.');
      });
    }

    // Initialize security measures
    initializeSecurity();

    // Initialize performance monitoring
    initializePerformanceMonitoring();

    // Cleanup function to prevent memory leaks
    return () => {
      // Import sessionManager and cleanup when app unmounts
      import('@/lib/sessionManager').then(({ sessionManager }) => {
        sessionManager.cleanup();
      });

      // Import pageStateManager and cleanup when app unmounts
      import('@/lib/pageStateManager').then(({ pageStateManager }) => {
        pageStateManager.cleanup();
      });

      // Import analytics and cleanup when app unmounts
      import('@/lib/anonymousAnalytics').then(({ analytics }) => {
        analytics.cleanup();
      });
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <AuthProvider>
          <AppInitializationProvider>
            <RouterProvider router={router} />
          </AppInitializationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
