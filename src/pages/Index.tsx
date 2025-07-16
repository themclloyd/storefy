
import { useEffect, useState, Suspense, lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { usePermissions } from "@/contexts/PermissionContext";
import { useNavigate, useSearchParams, useLocation, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { StoreSelector } from "@/components/stores/StoreSelector";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggleButton } from "@/components/ui/theme-toggle";

// Lazy load view components for code splitting
const SimpleDashboard = lazy(() => import("@/components/dashboard/SimpleDashboard").then(module => ({ default: module.SimpleDashboard })));
const POSView = lazy(() => import("@/components/pos/POSView").then(module => ({ default: module.POSView })));
const InventoryView = lazy(() => import("@/components/inventory/InventoryView").then(module => ({ default: module.InventoryView })));

const ExpenseView = lazy(() => import("@/components/expenses/ExpenseView").then(module => ({ default: module.ExpenseView })));
const TransactionView = lazy(() => import("@/components/transactions/TransactionView").then(module => ({ default: module.TransactionView })));
const CustomersView = lazy(() => import("@/components/customers/CustomersView").then(module => ({ default: module.CustomersView })));
const ReportsView = lazy(() => import("@/components/reports/ReportsView").then(module => ({ default: module.ReportsView })));
const SettingsView = lazy(() => import("@/components/settings/SettingsView").then(module => ({ default: module.SettingsView })));
const StoreManagementView = lazy(() => import("@/components/stores/StoreManagementView").then(module => ({ default: module.StoreManagementView })));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentStore, stores, loading: storeLoading, isOwner } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [activeView, setActiveView] = useState("dashboard");

  // Check for PIN session
  const pinSession = localStorage.getItem('pin_session');
  const hasPinSession = pinSession !== null;

  useEffect(() => {
    if (!authLoading && !user && !hasPinSession) {
      navigate("/");
    }
  }, [user, authLoading, navigate, hasPinSession]);

  // Handle URL path for view selection
  useEffect(() => {
    const path = location.pathname;
    const pathToView = {
      '/app': 'dashboard',
      '/dashboard': 'dashboard',
      '/pos': 'pos',
      '/inventory': 'inventory',
      '/categories': 'categories',
      '/suppliers': 'suppliers',
      '/expenses': 'expenses',
      '/layby': 'layby',
      '/transactions': 'transactions',
      '/customers': 'customers',
      '/reports': 'reports',
      '/settings': 'settings',
      '/stores': 'stores'
    };

    const view = pathToView[path as keyof typeof pathToView] || 'dashboard';
    setActiveView(view);
  }, [location.pathname]);

  // Update document title based on active view
  useEffect(() => {
    const viewTitles = {
      dashboard: "Dashboard",
      pos: "POS System",
      inventory: "Inventory",
      categories: "Categories",
      suppliers: "Suppliers",
      expenses: "Expenses",
      layby: "Layby",
      transactions: "Transactions",
      customers: "Customers",
      reports: "Reports",
      settings: "Settings",
      stores: "Store Management"
    };

    const viewTitle = viewTitles[activeView as keyof typeof viewTitles] || "Dashboard";
    document.title = `${viewTitle} - Storefy`;
  }, [activeView]);

  // Handle view changes with URL updates
  const handleViewChange = (view: string) => {
    setActiveView(view);

    // Navigate to clean URLs
    const viewToPath = {
      'dashboard': '/dashboard',
      'pos': '/pos',
      'inventory': '/inventory',
      'categories': '/categories',
      'suppliers': '/suppliers',
      'expenses': '/expenses',
      'layby': '/layby',
      'transactions': '/transactions',
      'customers': '/customers',
      'reports': '/reports',
      'settings': '/settings',
      'stores': '/stores'
    };

    const path = viewToPath[view as keyof typeof viewToPath] || '/dashboard';
    navigate(path, { replace: false });
  };

  const renderView = () => {
    // Show store management view for owners with multiple stores
    if (isOwner && stores.length > 1 && activeView === "stores") {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <StoreManagementView />
        </Suspense>
      );
    }

    const viewComponent = (() => {
      switch (activeView) {
        case "dashboard":
          return <SimpleDashboard onViewChange={handleViewChange} />;
        case "pos":
          return <POSView />;
        case "inventory":
          return <InventoryView />;
        case "expenses":
          return <ExpenseView />;
        case "layby":
        case "transactions":
          return <TransactionView />;
        case "customers":
          return <CustomersView />;
        case "reports":
          return <ReportsView />;
        case "settings":
          return <SettingsView />;
        case "stores":
          return <StoreManagementView />;
        default:
          return <SimpleDashboard onViewChange={handleViewChange} />;
      }
    })();

    return (
      <Suspense fallback={<LoadingSpinner />}>
        {viewComponent}
      </Suspense>
    );
  };

  // Show loading spinner while checking auth
  if (authLoading && !hasPinSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in and no PIN session
  if (!user && !hasPinSession) {
    return null;
  }

  // For PIN sessions, go directly to POS or show store selector
  if (hasPinSession && !user) {
    const pinData = JSON.parse(pinSession);
    
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

    return (
      <SidebarProvider defaultOpen={true}>
        <Sidebar
          collapsible="icon"
          activeView={activeView}
          onViewChange={handleViewChange}
          currentStore={pinData.store_name}
        />
        <SidebarInset>
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {renderView()}
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

  // If PIN user but no current store, there's an issue - redirect to PIN login
  if (!currentStore && hasPinSession) {
    localStorage.removeItem('pin_session');
    window.location.href = '/pin-login';
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Sidebar */}
      <Sidebar
        collapsible="icon"
        activeView={activeView}
        onViewChange={handleViewChange}
        currentStore={currentStore.name}
      />

      <SidebarInset>
        {/* Header with Breadcrumbs */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4 px-4">
            <SidebarTrigger className="h-8 w-8" />
            <div className="h-4 w-px bg-border" />
            <Breadcrumbs activeView={activeView} />
          </div>

          {/* Theme Toggle in Top Right */}
          <div className="flex items-center gap-2 px-4 ml-auto">
            <ThemeToggleButton />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 pb-20 md:pb-6">
            {renderView()}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <MobileBottomNav activeView={activeView} onViewChange={handleViewChange} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;
