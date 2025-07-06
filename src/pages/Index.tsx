import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { POSView } from "@/components/pos/POSView";
import { InventoryView } from "@/components/inventory/InventoryView";
import { CustomersView } from "@/components/customers/CustomersView";
import { ReportsView } from "@/components/reports/ReportsView";
import { SettingsView } from "@/components/settings/SettingsView";
import { useState } from "react";

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");

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

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar 
          activeView={activeView} 
          onViewChange={setActiveView}
          currentStore="Main Store"
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
