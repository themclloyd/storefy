import { Building2, BarChart3, Package, Users, ShoppingCart, Settings, LogOut, Store, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentStore?: string;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "pos", label: "POS System", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeView, onViewChange, currentStore }: SidebarProps) {
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
            {currentStore || "Main Store"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
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
              <Icon className="w-5 h-5" />
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
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}