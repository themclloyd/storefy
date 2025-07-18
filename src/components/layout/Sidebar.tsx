
import { Store, CreditCard } from "lucide-react";
import { useRoleBasedNavigation } from "@/hooks/useRoleBasedAccess";
import { CompactStoreSelector } from "@/components/stores/CompactStoreSelector";
import { UserMenu } from "@/components/layout/UserMenu";

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

  // Get all navigation items (already filtered by role permissions)
  const filteredMainNav = navigationItems;

  return (
    <SidebarPrimitive
      side="left"
      variant="sidebar"
      collapsible="icon"
      className="border-r border-border/40 bg-sidebar"
    >
      <SidebarHeader className="border-b border-border/40 bg-sidebar">
        {/* Logo Section - Responsive */}
        <div className="flex items-center px-3 md:px-4 py-3 md:py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                tooltip={state === "collapsed" ? "Storefy - Retail Management" : undefined}
                className="h-12 md:h-auto"
              >
                <a href="#" className="flex items-center gap-2 md:gap-3 px-2 md:px-3 justify-start">
                  <div className="flex aspect-square size-8 md:size-10 items-center justify-center rounded-lg md:rounded-xl bg-primary text-primary-foreground shadow-lg shrink-0">
                    <Store className="size-4 md:size-5" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span className="truncate font-bold text-foreground text-sm md:text-base">Storefy</span>
                    <span className="truncate text-xs text-muted-foreground hidden md:block">Retail Management</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 md:px-4 py-3 md:py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs md:text-sm">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMainNav.map((item) => {
                const Icon = item.icon;

                // Skip items without valid icons
                if (!Icon) {
                  console.warn(`Navigation item ${item.id} has no icon`);
                  return null;
                }

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeView === item.id}
                      onClick={() => onViewChange(item.id)}
                      tooltip={state === "collapsed" ? item.label : undefined}
                      className="h-11 md:h-10 px-2 md:px-3 justify-start gap-2 md:gap-3 text-sm md:text-base"
                    >
                      <Icon className="size-5 md:size-4 shrink-0" />
                      <span className="truncate font-medium md:font-normal">{item.label}</span>
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
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
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
