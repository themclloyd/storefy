
import { Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRoleBasedNavigation } from "@/hooks/useRoleBasedAccess";
import { useUser } from "@/stores/authStore";
import { usePermissions } from "@/stores/permissionStore";
import { CompactStoreSelector } from "@/components/stores/CompactStoreSelector";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";
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
import { useScreenSize } from "@/hooks/use-mobile";
import { responsiveSpacing, responsiveIcon, touchFriendly } from "@/lib/responsive-utils";
import {} from "@/lib/utils";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  collapsible?: "icon" | "offcanvas" | "none";
}

export function Sidebar({ activeView, onViewChange, collapsible = "icon" }: SidebarProps) {
  const { state } = useSidebar();
  const { getNavigationItems } = useRoleBasedNavigation();
  const navigate = useNavigate();
  const user = useUser();
  const { userRole } = usePermissions();
  const { isMobile, isTablet } = useScreenSize();

  // Get role-based navigation items (already filtered by permissions)
  const navigationItems = getNavigationItems();

  return (
    <SidebarPrimitive
      side="left"
      variant="sidebar"
      collapsible={collapsible}
      className="border-r border-border/40 bg-sidebar"
    >
      <SidebarHeader className="border-b border-border/40 bg-sidebar">
        {/* Logo Section - Compact */}
        <div className="flex items-center p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="default"
                asChild
                tooltip={state === "collapsed" ? "Storefy - Retail Management" : undefined}
                className={cn(
                  touchFriendly.minTouch,
                  "h-10 sm:h-12"
                )}
              >
                <a href="#" className="flex items-center gap-2 px-2 justify-start">
                  <div className={cn(
                    "flex aspect-square items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shrink-0",
                    "size-7 sm:size-8"
                  )}>
                    <Store className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight min-w-0">
                    <span className="truncate font-light text-foreground text-sm">Storefy</span>
                    <span className="truncate text-xs text-muted-foreground hidden sm:block">Retail Management</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs px-2 font-light">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;

                // Skip items without valid icons
                if (!Icon) {
                  return null;
                }

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeView === item.id}
                      onClick={() => {
                        navigate(`/app/${item.id}`);
                        onViewChange(item.id);
                      }}
                      tooltip={state === "collapsed" ? item.label : undefined}
                      className="px-2 justify-start gap-2 text-sm h-9"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate font-light">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>




      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-sidebar">
        <div className="p-2 space-y-2">
          {/* User Menu - Compact */}
          <UserMenu onViewChange={onViewChange} />

          {/* Store Selector - Compact */}
          <div className="w-full">
            <CompactStoreSelector />
          </div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
