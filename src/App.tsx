import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppInitializationProvider } from "@/contexts/AppInitializationContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
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
    <StoreProvider>
      <PermissionProvider>
        <AnalyticsProvider>
          <SessionActivityTracker>
            <HiddenAdminAccess>
              <SessionWarning />
              <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<ProtectedRoute requiredPage="dashboard"><Index /></ProtectedRoute>} />
                <Route path="/pos" element={<ProtectedRoute requiredPage="pos"><Index /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute requiredPage="inventory"><Index /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute requiredPage="categories"><Index /></ProtectedRoute>} />
                <Route path="/suppliers" element={<ProtectedRoute requiredPage="suppliers"><Index /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute requiredPage="customers"><Index /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/layby" element={<ProtectedRoute requiredPage="layby"><Index /></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute requiredPage="transactions"><Index /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute requiredPage="reports"><Index /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute requiredPage="expenses"><Index /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute requiredPage="settings"><Index /></ProtectedRoute>} />
                <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
                <Route path="/payment-result" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
                <Route path="/stores" element={<StoreSelectionPage />} />
                <Route path="/system" element={<SystemManagementView />} />
                <Route path="/app" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/pin-login" element={<PinLoginPage />} />
                <Route path="/store/:storeCode" element={<StoreShortLinkPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </HiddenAdminAccess>
          </SessionActivityTracker>
        </AnalyticsProvider>
      </PermissionProvider>
    </StoreProvider>
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
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <AuthProvider>
            <AppInitializationProvider>
              <AppContent />
            </AppInitializationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
