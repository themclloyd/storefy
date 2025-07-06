
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { POSView } from "@/components/pos/POSView";
import { InventoryView } from "@/components/inventory/InventoryView";
import { CategoriesView } from "@/components/inventory/CategoriesView";
import { SuppliersView } from "@/components/inventory/SuppliersView";
import { LaybyView } from "@/components/layby/LaybyView";
import { TransactionView } from "@/components/transactions/TransactionView";
import { CustomersView } from "@/components/customers/CustomersView";
import { ReportsView } from "@/components/reports/ReportsView";
import { SettingsView } from "@/components/settings/SettingsView";
import { StoreSelector } from "@/components/stores/StoreSelector";
import { StoreManagementView } from "@/components/stores/StoreManagementView";

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
      navigate("/auth");
    }
  }, [user, authLoading, navigate, hasPinSession]);

  // Handle URL path for view selection
  useEffect(() => {
    const path = location.pathname;
    const pathToView = {
      '/': 'dashboard',
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
      'dashboard': '/',
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

    const path = viewToPath[view as keyof typeof viewToPath] || '/';
    navigate(path, { replace: false });
  };

  const renderView = () => {
    // Show store management view for owners with multiple stores
    if (isOwner && stores.length > 1 && activeView === "stores") {
      return <StoreManagementView />;
    }

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
      <div className="h-screen flex bg-background">
        {/* Sidebar for PIN users */}
        <div className="w-64 flex-shrink-0">
          <Sidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            currentStore={pinData.store_name}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">

            {renderView()}
          </div>
        </div>
      </div>
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
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          currentStore={currentStore.name}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">

          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default Index;
