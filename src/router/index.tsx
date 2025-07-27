import { createBrowserRouter, LoaderFunctionArgs, redirect, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from '@/lib/sessionManager';
import { AppProviders } from '@/components/providers/AppProviders';

// Lazy load components
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const PinLoginPage = lazy(() => import('@/pages/PinLoginPage'));
const RouterAppLayout = lazy(() => import('@/components/layout/RouterAppLayout'));
const Dashboard = lazy(() => import('@/components/dashboard/SimpleFocusedDashboardWithNavigation').then(m => ({ default: m.SimpleFocusedDashboardWithNavigation })));
const ReportsView = lazy(() => import('@/components/reports/ReportsWithNavigation').then(m => ({ default: m.ReportsWithNavigation })));
const POSView = lazy(() => import('@/components/pos/POSView').then(m => ({ default: m.POSView })));
const InventoryView = lazy(() => import('@/components/inventory/InventoryView').then(m => ({ default: m.InventoryView })));
const CategoriesView = lazy(() => import('@/components/inventory/CategoriesView').then(m => ({ default: m.CategoriesView })));
const SuppliersView = lazy(() => import('@/components/inventory/SuppliersView').then(m => ({ default: m.SuppliersView })));
const CustomersView = lazy(() => import('@/components/customers/CustomersView').then(m => ({ default: m.CustomersView })));
const LaybyView = lazy(() => import('@/components/layby/LaybyView').then(m => ({ default: m.LaybyView })));
const TransactionView = lazy(() => import('@/components/transactions/TransactionView').then(m => ({ default: m.TransactionView })));
const PublicOrdersView = lazy(() => import('@/components/orders/PublicOrdersView').then(m => ({ default: m.PublicOrdersView })));

const ExpenseView = lazy(() => import('@/components/expenses/ExpenseView').then(m => ({ default: m.ExpenseView })));
const ShowcaseView = lazy(() => import('@/components/showcase/ShowcaseManagementView').then(m => ({ default: m.ShowcaseManagementView })));
const PublicStoreShowcase = lazy(() => import('@/components/showcase/PublicStoreShowcase').then(m => ({ default: m.PublicStoreShowcase })));
const SettingsView = lazy(() => import('@/components/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const PaymentResultPage = lazy(() => import('@/pages/PaymentResultPage'));
const StoreSelectionPage = lazy(() => import('@/pages/StoreSelectionPage'));
const StoreShortLinkPage = lazy(() => import('@/pages/StoreShortLinkPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Design System Demo (Development)
const DesignSystemDemo = lazy(() => import('@/components/test/DesignSystemDemo').then(m => ({ default: m.DesignSystemDemo })));





// Protected route loader
async function protectedLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  const pinSession = sessionManager.getPinSession();
  
  if (!session && !pinSession) {
    return redirect('/auth');
  }
  
  // For PIN sessions, ensure they have store access
  if (pinSession && !session) {
    const pinData = JSON.parse(localStorage.getItem('pin_session') || '{}');
    if (!pinData.storeId) {
      return redirect('/stores');
    }
  }
  
  return {
    user: session?.user || null,
    session: session || null,
    pinSession: pinSession,
    pathname
  };
}

// Store data loader
async function storeLoader() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { stores: [], currentStore: null };
    
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', session.user.id);
      
    if (error) throw error;
    
    return { stores: stores || [], currentStore: null };
  } catch (error) {
    console.error('Store loader error:', error);
    return { stores: [], currentStore: null };
  }
}

// Create the router with data API
export const router = createBrowserRouter([
  // Public routes (no authentication providers)
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/pin-login',
    element: <PinLoginPage />,
  },
  {
    path: '/design-system',
    element: <DesignSystemDemo />,
  },
  // Public store showcase routes (no authentication required)
  {
    path: '/showcase/:storeId',
    element: <PublicStoreShowcase />,
  },
  {
    path: '/store/:storeCode/catalog',
    element: <PublicStoreShowcase />,
  },
  {
    path: '/shop',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/shop/:storeSlug',
    element: <PublicStoreShowcase />,
  },
  {
    path: '/store/:storeCode',
    element: <StoreShortLinkPage />,
  },
  // Protected routes with authentication providers
  {
    path: '/app',
    element: <AppProviders />,
    errorElement: <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
      <p className="text-gray-600">Please refresh the page or contact support if the issue persists.</p>
    </div>,
    children: [
      {
        index: true,
        loader: () => redirect('/app/dashboard'),
      },
      {
        path: 'stores',
        element: <StoreSelectionPage />,
        loader: storeLoader,
      },
      // Main app routes with layout
      {
        path: 'dashboard',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
        ],
      },
      {
        path: 'reports',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <ReportsView />,
          },
        ],
      },
      {
        path: 'pos',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <POSView />,
          },
        ],
      },
      {
        path: 'inventory',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <InventoryView />,
          },
        ],
      },
      {
        path: 'categories',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <CategoriesView onClose={() => {}} />,
          },
        ],
      },
      {
        path: 'suppliers',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <SuppliersView onClose={() => {}} />,
          },
        ],
      },
      {
        path: 'customers',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <CustomersView />,
          },
        ],
      },
      {
        path: 'layby',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <LaybyView />,
          },
        ],
      },
      {
        path: 'transactions',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <TransactionView />,
          },
        ],
      },

      {
        path: 'orders',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <PublicOrdersView />,
          },
        ],
      },

      {
        path: 'expenses',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <ExpenseView />,
          },
        ],
      },

      {
        path: 'showcase',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <ShowcaseView />,
          },
        ],
      },
      {
        path: 'settings',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <SettingsView />,
          },
        ],
      },
      {
        path: 'subscription',
        loader: () => redirect('/app/settings?tab=subscription'),
      },
      {
        path: 'payment-result',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            element: <PaymentResultPage />,
          },
        ],
      },

    ],
  },
  // Legacy routes for backward compatibility
  {
    path: '/dashboard',
    loader: () => redirect('/app/dashboard'),
  },
  {
    path: '/pos',
    loader: () => redirect('/app/pos'),
  },
  {
    path: '/inventory',
    loader: () => redirect('/app/inventory'),
  },
  {
    path: '/categories',
    loader: () => redirect('/app/categories'),
  },
  {
    path: '/suppliers',
    loader: () => redirect('/app/suppliers'),
  },
  {
    path: '/customers',
    loader: () => redirect('/app/customers'),
  },
  {
    path: '/layby',
    loader: () => redirect('/app/layby'),
  },
  {
    path: '/transactions',
    loader: () => redirect('/app/transactions'),
  },
  {
    path: '/orders',
    loader: () => redirect('/app/orders'),
  },
  {
    path: '/reports',
    loader: () => redirect('/app/reports'),
  },
  {
    path: '/expenses',
    loader: () => redirect('/app/expenses'),
  },

  {
    path: '/showcase',
    loader: () => redirect('/app/showcase'),
  },
  {
    path: '/settings',
    loader: () => redirect('/app/settings'),
  },
  {
    path: '/stores',
    loader: () => redirect('/app/stores'),
  },

  // 404 catch-all
  {
    path: '*',
    element: <NotFound />,
  },
]);
