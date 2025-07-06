import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { POSView } from "@/components/pos/POSView";
import { InventoryView } from "@/components/inventory/InventoryView";
import { CustomersView } from "@/components/customers/CustomersView";
import { ReportsView } from "@/components/reports/ReportsView";
import { SettingsView } from "@/components/settings/SettingsView";
import { StoreSelector } from "@/components/stores/StoreSelector";
import { useState } from "react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentStore, stores, loading: storeLoading } = useStore();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "pos":
        return <POSView />;
      case "inventory":
        return <InventoryView />;
      case "customers":
        return <CustomersView />;
      case "reports":
        return <ReportsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return null;
  }

  // Show store selector if no current store or still loading stores
  if (storeLoading || !currentStore) {
    return <StoreSelector />;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar 
          activeView={activeView} 
          onViewChange={setActiveView}
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
