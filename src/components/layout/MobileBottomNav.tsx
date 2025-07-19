import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Clock,
  Settings,
  DollarSign,
  CreditCard,
  TrendingUp,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navigationItems = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "pos", label: "POS", icon: ShoppingCart },
  { id: "showcase", label: "Showcase", icon: Globe },
  { id: "inventory", label: "Stock", icon: Package },
  { id: "customers", label: "Customers", icon: Users }
];

export function MobileBottomNav({ activeView, onViewChange }: MobileBottomNavProps) {
  return (
    <div className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around h-16 px-1 safe-area-inset-bottom">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-2 rounded-xl transition-all duration-200 min-h-[52px] min-w-[52px] touch-manipulation flex-1 max-w-[80px]",
                isActive
                  ? "text-primary bg-primary/15 shadow-sm scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70 active:scale-95"
              )}
              aria-label={`Navigate to ${item.label}`}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mb-1 transition-all duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className={cn(
                "text-xs font-medium transition-all duration-200 leading-tight text-center",
                isActive ? "opacity-100 font-semibold" : "opacity-70"
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