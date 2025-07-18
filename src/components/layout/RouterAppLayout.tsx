import { Suspense, useEffect } from 'react';
import { Outlet, useLoaderData, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { StoreSelector } from '@/components/stores/StoreSelector';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggleButton } from '@/components/ui/theme-toggle';
import { InlineLoading } from '@/components/ui/modern-loading';
import { usePageLoading } from '@/stores/loadingStore';

interface AppLayoutData {
  user: any;
  session: any;
  pinSession: any;
  pathname: string;
}

export default function RouterAppLayout() {
  const data = useLoaderData() as AppLayoutData;
  const location = useLocation();
  const setPageLoading = usePageLoading();

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
    // Navigation is handled by React Router Link components in Sidebar
    console.log('🔄 View change requested:', view);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar
        collapsible="icon"
        activeView={currentView}
        onViewChange={handleViewChange}
      />
      <SidebarInset>
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-2">
              <StoreSelector />
              <ThemeToggleButton />
            </div>
          </div>

          {/* Main content */}
          <div className="p-6">
            <Suspense 
              fallback={
                <div className="flex items-center justify-center p-8">
                  <InlineLoading text="Loading..." size="lg" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </div>
      </SidebarInset>

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileBottomNav 
          activeView={currentView}
          onViewChange={handleViewChange}
        />
      </div>
    </SidebarProvider>
  );
}
