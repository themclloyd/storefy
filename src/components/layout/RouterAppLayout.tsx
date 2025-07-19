import { Suspense, useEffect } from 'react';
import { Outlet, useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { CompactStoreSelector } from '@/components/stores/CompactStoreSelector';
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
  const navigate = useNavigate();
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
    console.log('🔄 View change requested:', view);
    navigate(`/app/${view}`);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          collapsible="icon"
          activeView={currentView}
          onViewChange={handleViewChange}
        />
      </div>
      <SidebarInset>
        <div className="flex-1 overflow-auto h-screen">
          {/* Minimal Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground">
                {currentView === 'dashboard' ? 'Dashboard' :
                 currentView === 'reports' ? 'Reports & Analytics' :
                 currentView === 'pos' ? 'POS System' :
                 currentView === 'inventory' ? 'Inventory' :
                 currentView === 'customers' ? 'Customers' :
                 currentView === 'transactions' ? 'Transactions' :
                 currentView === 'expenses' ? 'Expenses' :
                 currentView === 'layby' ? 'Layby' :
                 currentView === 'subscription' ? 'Subscription' :
                 'Dashboard'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">MACA</span>
              <ThemeToggleButton />
            </div>
          </div>

          {/* Main content */}
          <div className="p-4">
            <Outlet />
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
