
import { Store, CreditCard } from "lucide-react";
import { useRoleBasedNavigation } from "@/hooks/useRoleBasedAccess";
import { CompactStoreSelector } from "@/components/stores/CompactStoreSelector";
import { UserMenu } from "@/components/layout/UserMenu";
import { SidebarSubscriptionStatus } from "@/components/subscription/SidebarSubscriptionStatus";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionContext";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}



export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { state } = useSidebar();
  const { getNavigationItems } = useRoleBasedNavigation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userRole } = usePermissions();

  // Get role-based navigation items
  const navigationItems = getNavigationItems();

  // Get filtered navigation items based on role permissions
  const filteredMainNav = [
    ...navigationItems.filter(item =>
      ['dashboard', 'pos', 'inventory', 'layby', 'expenses', 'customers', 'transactions', 'settings'].includes(item.id)
    )
  ];

  return (
    <SidebarPrimitive side="left" variant="sidebar" collapsible="icon" className="border-r border-border/40 bg-sidebar">
      <SidebarHeader className="border-b border-border/40 bg-sidebar">
        {/* Logo Section Only */}
        <div className="flex items-center px-4 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                tooltip={state === "collapsed" ? "Storefy - Retail Management" : undefined}
              >
                <a href="#" className="flex items-center gap-3 px-3 justify-start">
                  <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shrink-0">
                    <Store className="size-5" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span className="truncate font-bold text-foreground">Storefy</span>
                    
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMainNav.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeView === item.id}
                      onClick={() => onViewChange(item.id)}
                      tooltip={state === "collapsed" ? item.label : undefined}
                      className="h-10 px-3 justify-start gap-3"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/subscription')}
                  tooltip={state === "collapsed" ? "Subscription" : undefined}
                  className="h-10 px-3 justify-start gap-3"
                >
                  <CreditCard className="size-4 shrink-0" />
                  <span className="truncate">Subscription</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-sidebar">
        <div className="p-4 space-y-3">
          {/* Subscription Status */}
          <SidebarSubscriptionStatus />

          {/* User Menu - Big and Prominent */}
          <UserMenu onViewChange={onViewChange} />

          {/* Store Selector - Full Width */}
          <div className="w-full">
            <CompactStoreSelector />
          </div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
