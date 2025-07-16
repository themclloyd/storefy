import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


// Lazy load page components
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const PinLoginPage = lazy(() => import("./pages/PinLoginPage"));

const StoreShortLinkPage = lazy(() => import("./pages/StoreShortLinkPage"));
const StoreSelectionPage = lazy(() => import("./pages/StoreSelectionPage"));

const NotFound = lazy(() => import("./pages/NotFound"));


// Loading component for page-level Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider>
            <StoreProvider>
              <PermissionProvider>
                <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<ProtectedRoute requiredPage="dashboard"><Index /></ProtectedRoute>} />
                <Route path="/pos" element={<ProtectedRoute requiredPage="pos"><Index /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute requiredPage="inventory"><Index /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute requiredPage="categories"><Index /></ProtectedRoute>} />
                <Route path="/suppliers" element={<ProtectedRoute requiredPage="suppliers"><Index /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute requiredPage="expenses"><Index /></ProtectedRoute>} />

                <Route path="/layby" element={<ProtectedRoute requiredPage="layby"><Index /></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute requiredPage="transactions"><Index /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute requiredPage="customers"><Index /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute requiredPage="reports"><Index /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute requiredPage="settings"><Index /></ProtectedRoute>} />
                <Route path="/stores" element={<StoreSelectionPage />} />
                <Route path="/app" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/pin-login" element={<PinLoginPage />} />
                <Route path="/store/:storeCode" element={<StoreShortLinkPage />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
                </Suspense>
              </PermissionProvider>
            </StoreProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
