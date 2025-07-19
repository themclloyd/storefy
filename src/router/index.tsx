import { createBrowserRouter, LoaderFunctionArgs, redirect } from 'react-router-dom';
import { lazy } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from '@/lib/sessionManager';
import { AppProviders } from '@/components/providers/AppProviders';

// Lazy load components
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const PinLoginPage = lazy(() => import('@/pages/PinLoginPage'));
const RouterAppLayout = lazy(() => import('@/components/layout/RouterAppLayout'));
const Dashboard = lazy(() => import('@/components/dashboard/SimpleDashboard').then(m => ({ default: m.SimpleDashboard })));
const POSView = lazy(() => import('@/components/pos/POSView').then(m => ({ default: m.POSView })));
const InventoryView = lazy(() => import('@/components/inventory/InventoryView').then(m => ({ default: m.InventoryView })));
const CategoriesView = lazy(() => import('@/components/inventory/CategoriesView').then(m => ({ default: m.CategoriesView })));
const SuppliersView = lazy(() => import('@/components/inventory/SuppliersView').then(m => ({ default: m.SuppliersView })));
const CustomersView = lazy(() => import('@/components/customers/CustomersView').then(m => ({ default: m.CustomersView })));
const LaybyView = lazy(() => import('@/components/layby/LaybyView').then(m => ({ default: m.LaybyView })));
const TransactionView = lazy(() => import('@/components/transactions/TransactionView').then(m => ({ default: m.TransactionView })));
const ReportsView = lazy(() => import('@/components/reports/ReportsView').then(m => ({ default: m.ReportsView })));
const ExpenseView = lazy(() => import('@/components/expenses/ExpenseView').then(m => ({ default: m.ExpenseView })));
const AnalyticsView = lazy(() => import('@/components/analytics/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const ShowcaseView = lazy(() => import('@/components/showcase/ShowcaseManagementView').then(m => ({ default: m.ShowcaseManagementView })));
const SettingsView = lazy(() => import('@/components/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const PaymentResultPage = lazy(() => import('@/pages/PaymentResultPage'));
const StoreSelectionPage = lazy(() => import('@/pages/StoreSelectionPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Authentication loader
async function authLoader(): Promise<{ user: any; session: any } | Response> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    return {
      user: session?.user || null,
      session: session || null
    };
  } catch (error) {
    console.error('Auth loader error:', error);
    return redirect('/auth');
  }
}

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
  {
    path: '/',
    element: <AppProviders />,
    errorElement: <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
      <p className="text-gray-600">Please refresh the page or contact support if the issue persists.</p>
    </div>,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'auth',
        element: <AuthPage />,
      },
      {
        path: 'pin-login',
        element: <PinLoginPage />,
      },
      {
        path: 'stores',
        element: <StoreSelectionPage />,
        loader: storeLoader,
      },
      {
        path: 'app',
        element: <RouterAppLayout />,
        loader: protectedLoader,
        children: [
          {
            index: true,
            loader: () => redirect('/app/dashboard'),
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
            loader: protectedLoader,
          },
      {
        path: 'pos',
        element: <POSView />,
        loader: protectedLoader,
      },
      {
        path: 'inventory',
        element: <InventoryView />,
        loader: protectedLoader,
      },
      {
        path: 'categories',
        element: <CategoriesView />,
        loader: protectedLoader,
      },
      {
        path: 'suppliers',
        element: <SuppliersView />,
        loader: protectedLoader,
      },
      {
        path: 'customers',
        element: <CustomersView />,
        loader: protectedLoader,
      },
      {
        path: 'layby',
        element: <LaybyView />,
        loader: protectedLoader,
      },
      {
        path: 'transactions',
        element: <TransactionView />,
        loader: protectedLoader,
      },
      {
        path: 'reports',
        element: <ReportsView />,
        loader: protectedLoader,
      },
      {
        path: 'expenses',
        element: <ExpenseView />,
        loader: protectedLoader,
      },
      {
        path: 'analytics',
        element: <AnalyticsView />,
        loader: protectedLoader,
      },
      {
        path: 'showcase',
        element: <ShowcaseView />,
        loader: protectedLoader,
      },
      {
        path: 'settings',
        element: <SettingsView />,
        loader: protectedLoader,
      },
      {
        path: 'subscription',
        element: <SubscriptionPage />,
        loader: protectedLoader,
      },
      {
        path: 'payment-result',
        element: <PaymentResultPage />,
        loader: protectedLoader,
      },
        ],
      },
      // Legacy routes for backward compatibility
      {
        path: 'dashboard',
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
    path: '/reports',
    loader: () => redirect('/app/reports'),
  },
  {
    path: '/expenses',
    loader: () => redirect('/app/expenses'),
  },
  {
    path: '/analytics',
    loader: () => redirect('/app/analytics'),
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
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
