
import { useEffect, useState, Suspense, lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { StoreSelector } from "@/components/stores/StoreSelector";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

// Lazy load view components for code splitting
const DashboardView = lazy(() => import("@/components/dashboard/DashboardView").then(module => ({ default: module.DashboardView })));
const POSView = lazy(() => import("@/components/pos/POSView").then(module => ({ default: module.POSView })));
const InventoryView = lazy(() => import("@/components/inventory/InventoryView").then(module => ({ default: module.InventoryView })));
const CategoriesView = lazy(() => import("@/components/inventory/CategoriesView").then(module => ({ default: module.CategoriesView })));
const SuppliersView = lazy(() => import("@/components/inventory/SuppliersView").then(module => ({ default: module.SuppliersView })));
const LaybyView = lazy(() => import("@/components/layby/LaybyView").then(module => ({ default: module.LaybyView })));
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
          return <DashboardView />;
        case "pos":
          return <POSView />;
        case "inventory":
          return <InventoryView />;
        case "categories":
          return (
            <CategoriesView
              onClose={() => handleViewChange("inventory")}
              onViewCategoryProducts={(categoryId, categoryName) => {
                // This will be handled by the InventoryView's filtered view
                handleViewChange("inventory");
              }}
            />
          );
        case "suppliers":
          return (
            <SuppliersView
              onClose={() => handleViewChange("inventory")}
              onViewSupplierProducts={(supplierId, supplierName) => {
                // This will be handled by the InventoryView's filtered view
                handleViewChange("inventory");
              }}
            />
          );
        case "layby":
          return <LaybyView />;
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
          return <DashboardView />;
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
          activeView={activeView}
          onViewChange={handleViewChange}
          currentStore={pinData.store_name}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <h1 className="text-lg font-semibold">{pinData.store_name}</h1>
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {renderView()}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Show store management for owners with multiple stores by default
  if (isOwner && stores.length > 1 && !currentStore) {
    return <StoreManagementView />;
  }

  // Show store selector if no current store or still loading stores
  if (storeLoading || (!currentStore && stores.length <= 1)) {
    return <StoreSelector />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            currentStore={currentStore.name}
          />
        </div>

        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background sticky top-0 z-40">
            <SidebarTrigger className="-ml-1 md:hidden" />
            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-lg font-semibold truncate">{currentStore.name}</h1>
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

        {/* Mobile Sidebar */}
        <div className="md:hidden">
          <Sidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            currentStore={currentStore.name}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
