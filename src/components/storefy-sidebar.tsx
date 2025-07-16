import * as React from "react"
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  Clock,
  Settings,
  DollarSign,
  Store,
  FileText,
  Layers,
  Truck,
  Tag,
  HelpCircle,
  Search,
  LogOut
} from "lucide-react"

import { StorefyNavDocuments } from "@/components/storefy-nav-documents"
import { StorefyNavMain } from "@/components/storefy-nav-main"
import { StorefyNavSecondary } from "@/components/storefy-nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Storefy navigation data
const storefyData = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: BarChart3,
    },
    {
      title: "POS",
      url: "/pos",
      icon: ShoppingCart,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package,
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: DollarSign,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: Users,
    },
  ],
  navSecondary: [
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Stores",
      url: "/stores",
      icon: Store,
    },
  ],
  documents: [
    {
      name: "Categories",
      url: "/categories",
      icon: Tag,
    },
    {
      name: "Suppliers",
      url: "/suppliers",
      icon: Truck,
    },
    {
      name: "Expenses",
      url: "/expenses",
      icon: DollarSign,
    },
  ],
}

interface StorefySidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeView?: string;
  onViewChange?: (view: string) => void;
  currentStore?: string;
}

export function StorefySidebar({ 
  activeView, 
  onViewChange,
  currentStore = "My Store",
  ...props 
}: StorefySidebarProps) {
  // Handle navigation
  const handleNavigation = (url: string) => {
    if (onViewChange) {
      // Extract view from URL
      const view = url.replace('/', '');
      onViewChange(view);
    }
  };

  // Create navigation items with active state
  const navMainItems = storefyData.navMain.map(item => ({
    ...item,
    isActive: activeView === item.url.replace('/', ''),
    onClick: () => handleNavigation(item.url)
  }));

  const navSecondaryItems = storefyData.navSecondary.map(item => ({
    ...item,
    isActive: activeView === item.url.replace('/', ''),
    onClick: () => handleNavigation(item.url)
  }));

  const documentItems = storefyData.documents.map(item => ({
    ...item,
    isActive: activeView === item.url.replace('/', ''),
    onClick: () => handleNavigation(item.url)
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#" className="flex items-center gap-3">
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shrink-0">
                  <Store className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-foreground">Storefy</span>
                  <span className="truncate text-xs text-muted-foreground">{currentStore}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <StorefyNavMain items={navMainItems} />
        <StorefyNavDocuments items={documentItems} title="Store Management" />
        <StorefyNavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={storefyData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
