import { useEffect, useState, Suspense, lazy } from "react";
import { useUser, useAuthLoading } from "@/stores/authStore";
import { useCurrentStore, useStores, useStoreLoading, useIsOwner } from "@/stores/storeStore";
import { usePermissions } from "@/stores/permissionStore";
import { useRoleBasedNavigation } from "@/hooks/useRoleBasedAccess";
import { useNavigate, useSearchParams, useLocation, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { StoreSelector } from "@/components/stores/StoreSelector";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggleButton } from "@/components/ui/theme-toggle";
import { PageLoading, InlineLoading } from "@/components/ui/modern-loading";
import { usePageLoading } from "@/stores/loadingStore";
import { pageStateManager } from "@/lib/pageStateManager";

// Lazy load view components for code splitting
const SimpleDashboard = lazy(() => import("@/components/dashboard/SimpleDashboard").then(module => ({ default: module.SimpleDashboard })));
const POSView = lazy(() => import("@/components/pos/POSView").then(module => ({ default: module.POSView })));
const InventoryView = lazy(() => import("@/components/inventory/InventoryView").then(module => ({ default: module.InventoryView })));

const ExpenseView = lazy(() => import("@/components/expenses/ExpenseView").then(module => ({ default: module.ExpenseView })));
const LaybyView = lazy(() => import("@/components/layby/LaybyView").then(module => ({ default: module.LaybyView })));
const TransactionView = lazy(() => import("@/components/transactions/TransactionView").then(module => ({ default: module.TransactionView })));
const CustomersView = lazy(() => import("@/components/customers/CustomersView").then(module => ({ default: module.CustomersView })));
const ReportsView = lazy(() => import("@/components/reports/ReportsView").then(module => ({ default: module.ReportsView })));

const SettingsView = lazy(() => import("@/components/settings/SettingsView").then(module => ({ default: module.SettingsView })));
const StoreManagementView = lazy(() => import("@/components/stores/StoreManagementView").then(module => ({ default: module.StoreManagementView })));
const AnalyticsView = lazy(() => import("@/components/analytics/AnalyticsView").then(module => ({ default: module.AnalyticsView })));
const ShowcaseManagementView = lazy(() => import("@/components/showcase/ShowcaseManagementView").then(module => ({ default: module.ShowcaseManagementView })));

// Minimal loading component for Suspense fallback (component-level loading)
const LoadingSpinner = ({ view = 'dashboard' }: { view?: string }) => (
  <div className="flex items-center justify-center p-8">
    <InlineLoading text={`Loading ${view}...`} size="sm" />
  </div>
);

interface IndexProps {
  activeView?: string;
}

const Index = ({ activeView: propActiveView = 'dashboard' }: IndexProps) => {
  const user = useUser();
  const authLoading = useAuthLoading();
  const currentStore = useCurrentStore();
  const stores = useStores();
  const storeLoading = useStoreLoading();
  const isOwner = useIsOwner();
  const setPageLoading = usePageLoading();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Use prop activeView instead of internal routing logic
  const [activeView, setActiveView] = useState(propActiveView);

  // Modern loading for initial app state
  const isInitialLoading = authLoading || storeLoading || (!user && !localStorage.getItem('pin_session'));

  // Check for PIN session
  const pinSession = localStorage.getItem('pin_session');
  const hasPinSession = pinSession !== null;

  useEffect(() => {
    if (!authLoading && !user && !hasPinSession) {
      navigate("/");
    }
  }, [user, authLoading, navigate, hasPinSession]);

  // Update activeView when prop changes (for React Router navigation)
  useEffect(() => {
    setActiveView(propActiveView);
  }, [propActiveView]);

  // Save current page state when activeView changes
  useEffect(() => {
    if (user?.id && currentStore?.id && activeView) {
      pageStateManager.saveCurrentPage(activeView, user?.id, currentStore?.id);
    }
  }, [activeView, user?.id, currentStore?.id]);

  // Handle view changes with React Router navigation
  const handleViewChange = (view: string) => {
    console.log('🔄 View change requested:', view);

    // Navigate using React Router
    const viewToPath = {
      'dashboard': '/dashboard',
      'reports': '/reports',
      'pos': '/pos',
      'inventory': '/inventory',
      'categories': '/categories',
      'suppliers': '/suppliers',
      'expenses': '/expenses',
      'layby': '/layby',
      'transactions': '/transactions',
      'customers': '/customers',
      'showcase': '/showcase',
      'settings': '/settings',
      'stores': '/stores'
    };

    const newPath = viewToPath[view as keyof typeof viewToPath];
    if (newPath) {
      navigate(newPath);
    }

    // Save the page state
    if (user?.id && currentStore?.id) {
      pageStateManager.saveCurrentPage(view, user?.id, currentStore?.id);
    }
  };

  // Get available pages based on user permissions
  const { getAvailablePages } = useRoleBasedNavigation();
  const availablePages = getAvailablePages();

  // Use unified loading system for initial loading
  useEffect(() => {
    if (isInitialLoading) {
      setPageLoading(true, 'Loading application...');
    } else {
      setPageLoading(false);
    }

    return () => {
      setPageLoading(false);
    };
  }, [isInitialLoading, setPageLoading]);

  // Don't render anything while loading - the LoadingProvider will handle the UI
  if (isInitialLoading) {
    return null;
  }

  // Render the appropriate view component
  const renderView = () => {
    // Check if user has access to the current view
    if (!availablePages.includes(activeView)) {
      // Redirect to dashboard if no access
      if (activeView !== 'dashboard') {
        setActiveView('dashboard');
        navigate('/dashboard', { replace: true });
      }
      return <SimpleDashboard onViewChange={handleViewChange} />;
    }

    switch (activeView) {
      case 'dashboard':
        return <SimpleDashboard onViewChange={handleViewChange} />;
      case 'reports':
        return <ReportsView onViewChange={handleViewChange} />;

      case 'pos':
        return <POSView />;
      case 'inventory':
        return <InventoryView />;
      case 'expenses':
        return <ExpenseView />;
      case 'layby':
        return <LaybyView />;
      case 'transactions':
        return <TransactionView />;
      case 'customers':
        return <CustomersView />;
      case 'showcase':
        return <ShowcaseManagementView />;
      case 'settings':
        return <SettingsView />;
      case 'stores':
        return <StoreManagementView />;
      default:
        return <SimpleDashboard onViewChange={handleViewChange} />;
    }
  };

  const viewComponent = (
    <Suspense fallback={<LoadingSpinner view={activeView} />}>
      {renderView()}
    </Suspense>
  );

  // Redirect to auth if not logged in and no PIN session
  if (!user && !hasPinSession) {
    return null;
  }

  // For PIN sessions, go directly to POS or show store selector
  if (hasPinSession && !user) {
    const pinData = JSON.parse(pinSession);
    
    if (storeLoading) {
      // Use unified loading system
      setPageLoading(true, 'Loading store...');
      return null;
    }

    return (
      <SidebarProvider defaultOpen={true}>
        <Sidebar
          collapsible="icon"
          activeView={activeView}
          onViewChange={handleViewChange}
        />
        <SidebarInset>
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {viewComponent}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Show store selector if no current store for main users
  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading store...</p>
        </div>
      </div>
    );
  }

  // Main users must select a store - no exceptions
  if (!currentStore && !hasPinSession) {
    return <StoreSelector />;
  }

  // PIN users should never see store selector - they belong to a specific store
  if (!currentStore && hasPinSession) {
    // This should not happen, but redirect to PIN login if it does
    return <Navigate to="/pin-login" replace />;
  }

  // Main application layout with sidebar
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar
        collapsible="icon"
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      <SidebarInset>
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {viewComponent}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;
