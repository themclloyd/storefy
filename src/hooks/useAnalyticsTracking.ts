import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, AnalyticsEvent } from '@/utils/analytics';
import { useUser } from '@/stores/authStore';
import { useCurrentStore } from '@/stores/storeStore';

// Performance tracking hook
export const usePerformanceTracking = () => {
  const trackApiCall = useCallback((endpoint: string, duration: number, success: boolean) => {
    analytics.trackPerformance('api_response', duration, `${endpoint}_${success ? 'success' : 'error'}`);
  }, []);

  const trackSearchPerformance = useCallback((searchType: string, duration: number, resultsCount: number) => {
    analytics.trackPerformance('search_time', duration, `${searchType}_${resultsCount}_results`);
  }, []);

  const trackPageLoadTime = useCallback((page: string, loadTime: number) => {
    analytics.trackPerformance('page_load', loadTime, page);
  }, []);

  return {
    trackApiCall,
    trackSearchPerformance,
    trackPageLoadTime,
  };
};

// Page tracking hook
export const usePageTracking = () => {
  const location = useLocation();
  const user = useUser();
  const currentStore = useCurrentStore();

  useEffect(() => {
    // Set analytics context
    analytics.setContext(
      currentStore?.id || null,
      user?.user_metadata?.role || null
    );

    // Track page view
    const page = location.pathname;
    analytics.trackPageView(page, {
      search: location.search,
      hash: location.hash,
    });
  }, [location, currentStore, user]);
};

// Business event tracking hook
export const useBusinessTracking = () => {
  const currentStore = useCurrentStore();

  const trackTransaction = useCallback((data: {
    amount: number;
    itemsCount: number;
    paymentMethod: string;
    customerType?: 'new' | 'returning' | 'vip';
  }) => {
    if (!currentStore?.id) return;

    analytics.trackEvent('transaction_completed', {
      amount: data.amount,
      items_count: data.itemsCount,
      payment_method: data.paymentMethod,
      store_id: currentStore.id,
      customer_type: data.customerType,
    });

    // Track business metric
    analytics.trackBusinessMetric({
      type: 'revenue',
      value: data.amount,
      metadata: {
        items_count: data.itemsCount,
        payment_method: data.paymentMethod,
        customer_type: data.customerType,
      },
    });
  }, [currentStore]);

  const trackInventoryAction = useCallback((action: 'add' | 'edit' | 'delete' | 'stock_update', productCount: number = 1) => {
    if (!currentStore?.id) return;

    analytics.trackEvent('inventory_updated', {
      action,
      product_count: productCount,
      store_id: currentStore.id,
    });
  }, [currentStore]);

  const trackCustomerAction = useCallback((source: 'manual' | 'pos' | 'import') => {
    if (!currentStore?.id) return;

    analytics.trackEvent('customer_added', {
      source,
      store_id: currentStore.id,
    });
  }, [currentStore]);

  const trackLaybyCreation = useCallback((amount: number, depositAmount: number) => {
    if (!currentStore?.id) return;

    analytics.trackEvent('layby_created', {
      amount,
      deposit_amount: depositAmount,
      store_id: currentStore.id,
    });
  }, [currentStore]);

  const trackExpense = useCallback((data: {
    amount: number;
    category: string;
    type: 'one_time' | 'recurring';
  }) => {
    if (!currentStore?.id) return;

    analytics.trackEvent('expense_recorded', {
      amount: data.amount,
      category: data.category,
      type: data.type,
      store_id: currentStore.id,
    });
  }, [currentStore]);

  const trackReportGeneration = useCallback((reportType: 'sales' | 'inventory' | 'customer' | 'financial', dateRange: string) => {
    if (!currentStore?.id) return;

    analytics.trackEvent('report_generated', {
      report_type: reportType,
      date_range: dateRange,
      store_id: currentStore.id,
    });
  }, [currentStore]);

  const trackDashboardInteraction = useCallback((widget: string, action: 'view' | 'filter' | 'export') => {
    if (!currentStore?.id) return;

    analytics.trackEvent('dashboard_interaction', {
      widget,
      action,
      store_id: currentStore.id,
    });
  }, [currentStore]);

  const trackSearch = useCallback((searchType: 'product' | 'customer' | 'transaction', query: string, resultsCount: number) => {
    if (!currentStore?.id) return;

    analytics.trackEvent('search_performed', {
      search_type: searchType,
      query_length: query.length,
      results_count: resultsCount,
      store_id: currentStore.id,
    });
  }, [currentStore]);

  return {
    trackTransaction,
    trackInventoryAction,
    trackCustomerAction,
    trackLaybyCreation,
    trackExpense,
    trackReportGeneration,
    trackDashboardInteraction,
    trackSearch,
  };
};

// Feature usage tracking hook
export const useFeatureTracking = () => {
  const currentStore = useCurrentStore();

  const trackFeatureUsage = useCallback((feature: string, context?: string) => {
    analytics.trackEvent('feature_used', {
      feature,
      context,
      store_id: currentStore?.id,
    });
  }, [currentStore]);

  return { trackFeatureUsage };
};

// Error tracking hook
export const useErrorTracking = () => {
  const trackError = useCallback((error: Error | string, context?: {
    type?: 'api' | 'ui' | 'auth' | 'payment';
    page?: string;
    additionalData?: Record<string, any>;
  }) => {
    analytics.trackError(error, context);
  }, []);

  return { trackError };
};

// Authentication tracking hook
export const useAuthTracking = () => {
  const currentStore = useCurrentStore();

  const trackLogin = useCallback((method: 'email' | 'pin' | 'store_code') => {
    analytics.trackEvent('user_login', {
      method,
      store_id: currentStore?.id,
    });
  }, [currentStore]);

  const trackSignup = useCallback(() => {
    analytics.trackEvent('user_signup', {
      method: 'email',
      store_id: currentStore?.id,
    });
  }, [currentStore]);

  const trackStoreAccess = useCallback((accessType: 'direct' | 'link', storeCode: string) => {
    analytics.trackEvent('store_access', {
      access_type: accessType,
      store_code: storeCode,
    });
  }, []);

  return {
    trackLogin,
    trackSignup,
    trackStoreAccess,
  };
};

// Combined analytics hook for convenience
export const useAnalytics = () => {
  const performance = usePerformanceTracking();
  const business = useBusinessTracking();
  const feature = useFeatureTracking();
  const error = useErrorTracking();
  const auth = useAuthTracking();

  return {
    ...performance,
    ...business,
    ...feature,
    ...error,
    ...auth,
    // Direct access to analytics instance
    track: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackBusinessMetric: analytics.trackBusinessMetric.bind(analytics),
  };
};
