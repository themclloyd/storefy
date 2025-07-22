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
          {/* Header with hamburger menu and theme toggle */}
          <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Menu */}
              <SidebarTrigger className={cn(touchFriendly.minTouch, "md:hidden")} />

              {/* Desktop: Show store name or app title */}
              <div className="hidden md:flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary-foreground rounded-sm" />
                </div>
                <span className="font-semibold text-foreground">
                  {currentStore?.name || 'Storefy'}
                </span>
              </div>
            </div>

            {/* Right side: Theme toggle and store selector */}
            <div className="flex items-center gap-2">
              {/* Store selector for mobile */}
              {currentStore && (
                <div className="md:hidden">
                  <CompactStoreSelector />
                </div>
              )}

              {/* Theme toggle */}
              <ThemeToggleButton />
            </div>
          </header>

          {/* Main content area - Full height with left spacing for box illusion */}
          <div className="flex-1 overflow-hidden bg-muted/20">
            <div className="h-full pl-4 md:pl-6 lg:pl-8 py-2">
              <div className="h-full bg-background border-l border-border/40 rounded-tl-lg shadow-sm border-t border-border/20">
                <div className="h-full p-3 md:p-4 lg:p-6">
                  <Outlet />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
