import { Suspense, useEffect } from 'react';
import { Outlet, useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { CompactStoreSelector } from '@/components/stores/CompactStoreSelector';
import { useCurrentStore, useStores } from '@/stores/storeStore';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggleButton } from '@/components/ui/theme-toggle';
import { InlineLoading } from '@/components/ui/modern-loading';
import { usePageLoading } from '@/stores/loadingStore';
import { useScreenSize } from '@/hooks/use-mobile';
import { responsiveContainer, responsiveSpacing, touchFriendly } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown } from 'lucide-react';

interface AppLayoutData {
  user: any;
  session: any;
  pinSession: any;
  pathname: string;
}

export default function RouterAppLayout() {
  const data = useLoaderData() as AppLayoutData;
  const location = useLocation();
  const navigate = useNavigate();
  const setPageLoading = usePageLoading();
  const currentStore = useCurrentStore();
  const stores = useStores();
  const { isMobile, isTablet } = useScreenSize();

  // Clear loading when layout mounts
  useEffect(() => {
    setPageLoading(false);
  }, [setPageLoading]);

  // Get current view from pathname
  const getCurrentView = () => {
    const path = location.pathname.replace('/app/', '');
    return path || 'dashboard';
  };

  const currentView = getCurrentView();

  // Handle view changes by navigating
  const handleViewChange = (view: string) => {
    console.log('🔄 View change requested:', view);
    navigate(`/app/${view}`);
  };

  // If no store is selected, show store selector or creation prompt
  if (!currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className={cn(responsiveContainer.md, "text-center")}>
          <div className={cn(responsiveSpacing.margin.md, "mb-6")}>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
              {stores.length > 0 ? 'Select Your Store' : 'Welcome to Storefy'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {stores.length > 0
                ? 'Choose a store to continue'
                : 'Create your first store to get started'
              }
            </p>
          </div>
          <CompactStoreSelector />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      {/* Sidebar - Now visible on all devices */}
      <Sidebar
        collapsible={isMobile ? "offcanvas" : "icon"}
        activeView={currentView}
        onViewChange={handleViewChange}
      />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          {/* Mobile Header - Only show on mobile */}
          <div className="md:hidden flex flex-col gap-2 p-2 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <SidebarTrigger className={cn(touchFriendly.minTouch)} />
              <div className="flex items-center gap-2">
                {currentStore && <CompactStoreSelector />}
                <ThemeToggleButton />
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-9 w-full bg-muted/50"
              />
            </div>
          </div>

          {/* Desktop Header - Only show on desktop */}
          <div className="hidden md:flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  className="pl-9 w-64 bg-muted/50"
                />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-normal">
                {location.pathname === '/app/dashboard' ? 'Dashboard' :
                 location.pathname === '/app/orders' ? 'Orders' :
                 location.pathname === '/app/inventory' ? 'Inventory' :
                 location.pathname === '/app/laybys' ? 'Laybys' :
                 location.pathname === '/app/expenses' ? 'Expenses' :
                 location.pathname === '/app/reports' ? 'Reports' :
                 location.pathname === '/app/settings' ? 'Settings' :
                 'Storefy'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {location.pathname === '/app/dashboard' && (
                <Button variant="ghost" className="flex items-center gap-2">
                  Today's Overview
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
              <ThemeToggleButton />
            </div>
          </div>

          {/* Main content area - Full height with subtle background */}
          <div className="flex-1 overflow-hidden bg-muted/20">
            <div className="h-full w-full bg-background m-2 rounded-lg shadow-sm border border-border/40">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
