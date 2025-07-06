
import { Building2, BarChart3, Package, Users, ShoppingCart, Settings, LogOut, Store, CreditCard, FolderOpen, Truck, ChevronDown, ChevronRight, Clock, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { useState, useEffect } from "react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentStore?: string;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "pos", label: "POS System", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "layby", label: "Layby", icon: Clock },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "customers", label: "Customers", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeView, onViewChange, currentStore }: SidebarProps) {
  const { signOut } = useAuth();
  const { userRole, isOwner, stores } = useStore();
  const [inventoryExpanded, setInventoryExpanded] = useState(
    activeView === 'categories' || activeView === 'suppliers'
  );

  // Auto-expand when navigating to categories or suppliers
  useEffect(() => {
    if (activeView === 'categories' || activeView === 'suppliers') {
      setInventoryExpanded(true);
    }
  }, [activeView]);

  // Check for PIN session
  const pinSession = localStorage.getItem('pin_session');
  const pinData = pinSession ? JSON.parse(pinSession) : null;
  
  // Use PIN session role if available
  const effectiveRole = pinData?.role || userRole;
  const effectiveIsOwner = pinData ? pinData.role === 'owner' : isOwner;

  const handleSignOut = async () => {
    // Clear PIN session if exists
    if (pinSession) {
      localStorage.removeItem('pin_session');
      window.location.href = '/pin-login';
      return;
    }
    
    await signOut();
  };

  // Add stores management for owners with multiple stores
  const allNavigationItems = [
    ...(effectiveIsOwner && stores && stores.length > 1 
      ? [{ id: "stores", label: "Stores", icon: Building2 }] 
      : []),
    ...navigationItems
  ];

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-accent">
      {/* Logo & Store Selector */}
      <div className="p-6 border-b border-sidebar-accent">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Storefy</h1>
            <p className="text-sm text-sidebar-foreground/70">Retail Management</p>
          </div>
        </div>
        
        {/* Current Store */}
        <div className="bg-sidebar-accent rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-sidebar-foreground/70" />
            <span className="text-sidebar-foreground/70">Current Store:</span>
          </div>
          <p className="font-medium text-sidebar-foreground mt-1">
            {currentStore || "Loading..."}
          </p>
          {effectiveRole && (
            <p className="text-xs text-sidebar-foreground/60 mt-1 capitalize">
              Role: {effectiveRole}
              {pinData && " (PIN)"}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {allNavigationItems.map((item) => {
          const Icon = item.icon;

          // Hide settings for cashiers
          if (item.id === 'settings' && effectiveRole === 'cashier') {
            return null;
          }

          // Hide reports for cashiers
          if (item.id === 'reports' && effectiveRole === 'cashier') {
            return null;
          }

          // Hide stores management for non-owners
          if (item.id === 'stores' && !effectiveIsOwner) {
            return null;
          }

          // Special handling for inventory with inline dropdown
          if (item.id === 'inventory') {
            return (
              <div key={item.id} className="space-y-1">
                {/* Main Inventory Button */}
                <Button
                  variant={activeView === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 transition-smooth",
                    activeView === item.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                  onClick={() => onViewChange(item.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  {item.label}
                </Button>

                {/* Dropdown Toggle Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-3 transition-smooth ml-2",
                    (activeView === 'categories' || activeView === 'suppliers' || inventoryExpanded)
                      ? "text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                  )}
                  onClick={() => setInventoryExpanded(!inventoryExpanded)}
                >
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    {inventoryExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-sm">Manage</span>
                </Button>

                {/* Inline Dropdown Items */}
                {inventoryExpanded && (
                  <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    <div className="border-l-2 border-sidebar-accent/20 pl-4 space-y-1">
                      <Button
                        variant={activeView === 'categories' ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start gap-3 transition-smooth",
                          activeView === 'categories'
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                        )}
                        onClick={() => onViewChange('categories')}
                      >
                        <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                          <FolderOpen className="w-3 h-3" />
                        </div>
                        Categories
                      </Button>
                      <Button
                        variant={activeView === 'suppliers' ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start gap-3 transition-smooth",
                          activeView === 'suppliers'
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                        )}
                        onClick={() => onViewChange('suppliers')}
                      >
                        <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                          <Truck className="w-3 h-3" />
                        </div>
                        Suppliers
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 transition-smooth",
                activeView === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                  : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-accent">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          {pinSession ? "End Session" : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}
