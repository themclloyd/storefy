import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navigationItems = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "pos", label: "POS", icon: ShoppingCart },
  { id: "inventory", label: "Stock", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart3 }
];

export function MobileBottomNav({ activeView, onViewChange }: MobileBottomNavProps) {
  return (
    <div className="mobile-tab-bar bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t">
      <div className="flex items-center justify-around h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "mobile-touch-target flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all duration-200",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 mb-1 transition-transform duration-200",
                  isActive && "scale-110"
                )} 
              />
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}