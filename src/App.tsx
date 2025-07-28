import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { initializeSecurity } from "@/middleware/security";
import { initializeSessionMonitoring } from "@/lib/authUtils";

const queryClient = new QueryClient();

// Hydration fallback component
const HydrateFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Main app content - no more blocking initialization
function AppContent() {
  // Directly render the router - let individual routes handle their own loading
  return <RouterProvider router={router} hydrateFallback={<HydrateFallback />} />;
}

const App = () => {
  // Initialize session monitoring on app start
  useEffect(() => {
    initializeSessionMonitoring();

    // Initialize security measures (CSP disabled in dev)
    initializeSecurity();

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
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
