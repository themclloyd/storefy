import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { ThemeToggleButton } from './components/ui/button';

// Lazy load page components
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const PinLoginPage = lazy(() => import("./pages/PinLoginPage"));
const StoreLoginPage = lazy(() => import("./pages/StoreLoginPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PayPalStyleDemo = lazy(() => import("./components/demo/PayPalStyleDemo").then(module => ({ default: module.PayPalStyleDemo })));

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <ThemeToggleButton />
      </div>
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/pos" element={<Index />} />
                <Route path="/inventory" element={<Index />} />
                <Route path="/categories" element={<Index />} />
                <Route path="/suppliers" element={<Index />} />
                <Route path="/layby" element={<Index />} />
                <Route path="/transactions" element={<Index />} />
                <Route path="/customers" element={<Index />} />
                <Route path="/reports" element={<Index />} />
                <Route path="/settings" element={<Index />} />
                <Route path="/stores" element={<Index />} />
                <Route path="/app" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/pin-login" element={<PinLoginPage />} />
                <Route path="/store/:storeCode" element={<StoreLoginPage />} />
                <Route path="/paypal-demo" element={<PayPalStyleDemo />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
