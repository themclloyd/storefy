
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
        {/* Logo Section - Enhanced Responsive */}
        <div className={cn("flex items-center", responsiveSpacing.padding.sm)}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                tooltip={state === "collapsed" ? "Storefy - Retail Management" : undefined}
                className={cn(
                  touchFriendly.minTouch,
                  "h-12 sm:h-14 md:h-auto"
                )}
              >
                <a href="#" className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 justify-start">
                  <div className={cn(
                    "flex aspect-square items-center justify-center rounded-lg sm:rounded-xl bg-primary text-primary-foreground shadow-lg shrink-0",
                    "size-8 sm:size-9 md:size-10"
                  )}>
                    <Store className={cn(responsiveIcon.sm)} />
                  </div>
                  <div className="grid flex-1 text-left leading-tight min-w-0">
                    <span className="truncate font-bold text-foreground text-sm sm:text-base">Storefy</span>
                    <span className="truncate text-xs text-muted-foreground hidden sm:block">Retail Management</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className={cn(responsiveSpacing.padding.sm)}>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={cn(touchFriendly.touchSpacing)}>
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
                      className={cn(
                        touchFriendly.minTouch,
                        "px-2 sm:px-3 justify-start gap-2 sm:gap-3 text-sm sm:text-base"
                      )}
                    >
                      <Icon className={cn(responsiveIcon.sm, "shrink-0")} />
                      <span className="truncate font-medium sm:font-normal">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>




      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-sidebar">
        <div className={cn(
          responsiveSpacing.padding.sm,
          touchFriendly.touchSpacing
        )}>
          {/* User Menu - Enhanced for touch */}
          <UserMenu onViewChange={onViewChange} />

          {/* Store Selector - Full Width with responsive spacing */}
          <div className="w-full">
            <CompactStoreSelector />
          </div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
