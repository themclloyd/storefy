
import {
  Building2,
  BarChart3,
  Package,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  Store,
  FolderOpen,
  Truck,
  ChevronDown,
  ChevronRight,
  Clock,
  Receipt,
  Home,
  CreditCard,
  FileText,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { useState, useEffect } from "react";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentStore?: string;
}

// Main navigation items
const mainNavItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "pos", label: "POS System", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Package, hasSubmenu: true },
  { id: "expenses", label: "Expenses", icon: DollarSign },
  { id: "layby", label: "Layby", icon: Clock },
  { id: "customers", label: "Customers", icon: Users },
  { id: "transactions", label: "Transactions", icon: Receipt },
];

// Secondary navigation items
const secondaryNavItems = [
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeView, onViewChange, currentStore }: SidebarProps) {
  const { signOut } = useAuth();
  const { userRole, isOwner, stores } = useStore();
  const { state } = useSidebar();
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

  // Filter navigation items based on role
  const filteredMainNav = [
    ...(effectiveIsOwner && stores && stores.length > 1
      ? [{ id: "stores", label: "Stores", icon: Building2 }]
      : []),
    ...mainNavItems
  ];

  const filteredSecondaryNav = secondaryNavItems.filter(item => {
    // Hide settings and reports for cashiers
    if (effectiveRole === 'cashier' && (item.id === 'settings' || item.id === 'reports')) {
      return false;
    }
    return true;
  });

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader>
        {/* Logo Section */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Store className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Storefy</span>
                  <span className="truncate text-xs">Retail Management</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Current Store Info */}
        {currentStore && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" className="bg-sidebar-accent/50 hover:bg-sidebar-accent/70">
                <Building2 className="size-4" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{currentStore}</span>
                  {effectiveRole && (
                    <span className="truncate text-xs text-sidebar-foreground/60 capitalize">
                      {effectiveRole}{pinData && " (PIN)"}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainNav.map((item) => {
                const Icon = item.icon;

                // Special handling for inventory with submenu
                if (item.id === 'inventory' && item.hasSubmenu) {
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeView === item.id}
                        onClick={() => onViewChange(item.id)}
                        tooltip={state === "collapsed" ? item.label : undefined}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto size-4 transition-transform duration-200",
                            inventoryExpanded && "rotate-90"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInventoryExpanded(!inventoryExpanded);
                          }}
                        />
                      </SidebarMenuButton>
                      {inventoryExpanded && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={activeView === 'categories'}
                              onClick={() => onViewChange('categories')}
                            >
                              <FolderOpen className="size-4" />
                              <span>Categories</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={activeView === 'suppliers'}
                              onClick={() => onViewChange('suppliers')}
                            >
                              <Truck className="size-4" />
                              <span>Suppliers</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeView === item.id}
                      onClick={() => onViewChange(item.id)}
                      tooltip={state === "collapsed" ? item.label : undefined}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        {filteredSecondaryNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSecondaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeView === item.id}
                        onClick={() => onViewChange(item.id)}
                        tooltip={state === "collapsed" ? item.label : undefined}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={state === "collapsed" ? (pinSession ? "End Session" : "Sign Out") : undefined}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4" />
              <span>{pinSession ? "End Session" : "Sign Out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
