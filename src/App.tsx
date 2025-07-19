import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { initializeSecurity } from "@/middleware/security";
import { initializePerformanceMonitoring } from "@/utils/performance";
import { initializeSessionMonitoring } from "@/lib/authUtils";


// Loading component for page-level Suspense
const PageLoader = () => <PageLoading text="Loading page..." />;

const queryClient = new QueryClient();

// Main app content - no more blocking initialization
function AppContent() {
  // Directly render the router - let individual routes handle their own loading
  return <RouterProvider router={router} />;
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

    // Initialize security measures (CSP disabled in dev)
    initializeSecurity();

    // Initialize performance monitoring (temporarily disabled to prevent conflicts)
    // initializePerformanceMonitoring();

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
