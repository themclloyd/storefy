
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
  ChevronRight,
  Clock,
  Receipt,
  FileText,
  DollarSign,
  ChevronLeft,
  PanelLeft,
  Home,
  LayoutDashboard,
  CircleDollarSign,
  ShoppingBag,
  BarChart4,
  BarChart2
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
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentStore?: string;
}

// Main navigation items - these will now be integrated into the main dashboard
const mainNavItems = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "pos", label: "POS System", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Package, hasSubmenu: true },
  { id: "expenses", label: "Expenses", icon: CircleDollarSign },
  { id: "layby", label: "Layby", icon: Clock },
  { id: "customers", label: "Customers", icon: Users },
  { id: "transactions", label: "Transactions", icon: Receipt },
];

// Secondary navigation items
const secondaryNavItems = [
  { id: "reports", label: "Reports", icon: BarChart2 },
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
    <SidebarPrimitive collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 bg-sidebar/50">
        {/* Logo Section with Collapse Toggle */}
        <div className="flex items-center justify-between px-2 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#" className="flex items-center gap-3">
                  <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <Store className="size-5" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-foreground">Storefy</span>
                    <span className="truncate text-xs text-muted-foreground">Retail Management</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Collapse Toggle Button */}
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarTrigger className="h-8 w-8 hover:bg-sidebar-accent/50" />
          </div>
        </div>

        {/* Current Store Info */}
        {currentStore && (
          <div className="px-2 pb-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="sm"
                  className="bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg"
                  tooltip={state === "collapsed" ? currentStore : undefined}
                >
                  <Building2 className="size-4 text-primary" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-foreground">{currentStore}</span>
                    {effectiveRole && (
                      <span className="truncate text-xs text-muted-foreground capitalize">
                        {effectiveRole}{pinData && " (PIN)"}
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-2 mb-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
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
                        className={cn(
                          "w-full justify-start rounded-lg h-10 px-3 transition-all duration-200",
                          activeView === item.id
                            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="font-medium">{item.label}</span>
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
                        <SidebarMenuSub className="ml-4 mt-1 space-y-1">
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={activeView === 'categories'}
                              onClick={() => onViewChange('categories')}
                              className={cn(
                                "rounded-md h-8 px-3 transition-all duration-200",
                                activeView === 'categories'
                                  ? "bg-primary/20 text-primary font-medium"
                                  : "hover:bg-sidebar-accent/30 text-muted-foreground"
                              )}
                            >
                              <FolderOpen className="size-3" />
                              <span className="text-sm">Categories</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={activeView === 'suppliers'}
                              onClick={() => onViewChange('suppliers')}
                              className={cn(
                                "rounded-md h-8 px-3 transition-all duration-200",
                                activeView === 'suppliers'
                                  ? "bg-primary/20 text-primary font-medium"
                                  : "hover:bg-sidebar-accent/30 text-muted-foreground"
                              )}
                            >
                              <Truck className="size-3" />
                              <span className="text-sm">Suppliers</span>
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
                      className={cn(
                        "w-full justify-start rounded-lg h-10 px-3 transition-all duration-200",
                        activeView === item.id
                          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        {filteredSecondaryNav.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-2 mb-2">
              Settings
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredSecondaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeView === item.id}
                        onClick={() => onViewChange(item.id)}
                        tooltip={state === "collapsed" ? item.label : undefined}
                        className={cn(
                          "w-full justify-start rounded-lg h-10 px-3 transition-all duration-200",
                          activeView === item.id
                            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-sidebar/50 px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={state === "collapsed" ? (pinSession ? "End Session" : "Sign Out") : undefined}
              className={cn(
                "w-full justify-start rounded-lg h-10 px-3 transition-all duration-200",
                "hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
              )}
            >
              <LogOut className="size-4 shrink-0" />
              <span className="font-medium">{pinSession ? "End Session" : "Sign Out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
