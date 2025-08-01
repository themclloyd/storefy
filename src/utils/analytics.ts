// Generic analytics implementation - no external dependencies

// Analytics event types for type safety
export interface AnalyticsEvent {
  // User Authentication Events
  'user_login': { method: 'email' | 'pin' | 'store_code'; store_id?: string };
  'user_logout': { session_duration: number; store_id?: string };
  'user_signup': { method: 'email'; store_id?: string };
  'store_access': { access_type: 'direct' | 'link'; store_code: string };
  
  // Business Operations Events
  'transaction_completed': { 
    amount: number; 
    items_count: number; 
    payment_method: string;
    store_id: string;
    customer_type?: 'new' | 'returning' | 'vip';
  };
  'inventory_updated': { 
    action: 'add' | 'edit' | 'delete' | 'stock_update';
    product_count: number;
    store_id: string;
  };
  'customer_added': { 
    source: 'manual' | 'pos' | 'import';
    store_id: string;
  };
  'layby_created': {
    amount: number;
    deposit_amount: number;
    store_id: string;
  };
  'expense_recorded': {
    amount: number;
    category: string;
    type: 'one_time' | 'recurring';
    store_id: string;
  };
  
  // Navigation & UI Events
  'page_view': { 
    page: string; 
    store_id?: string;
    user_role?: 'owner' | 'manager' | 'cashier';
  };
  'feature_used': { 
    feature: string; 
    context?: string;
    store_id?: string;
  };
  'report_generated': {
    report_type: 'sales' | 'inventory' | 'customer' | 'financial';
    date_range: string;
    store_id: string;
  };
  
  // Performance Events
  'performance_metric': {
    metric: 'page_load' | 'api_response' | 'search_time';
    value: number;
    context?: string;
  };
  
  // Error Events
  'error_occurred': {
    error_type: 'api' | 'ui' | 'auth' | 'payment';
    error_message: string;
    page?: string;
    store_id?: string;
  };
  
  // Business Intelligence Events
  'dashboard_interaction': {
    widget: string;
    action: 'view' | 'filter' | 'export';
    store_id: string;
  };
  'search_performed': {
    search_type: 'product' | 'customer' | 'transaction';
    query_length: number;
    results_count: number;
    store_id: string;
  };
}

// Analytics configuration
export const analyticsConfig = {
  // Enable/disable analytics based on environment
  enabled: import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // Debug mode for development
  debug: import.meta.env.DEV && import.meta.env.VITE_ANALYTICS_DEBUG === 'true',
  
  // Sampling rate for performance events (0-1)
  performanceSampleRate: 0.1,
  
  // User consent (GDPR compliance)
  requireConsent: import.meta.env.VITE_REQUIRE_ANALYTICS_CONSENT === 'true',
};

// User consent management
class ConsentManager {
  private static readonly CONSENT_KEY = 'storefy_analytics_consent';
  
  static hasConsent(): boolean {
    if (!analyticsConfig.requireConsent) return true;
    return localStorage.getItem(this.CONSENT_KEY) === 'granted';
  }
  
  static grantConsent(): void {
    localStorage.setItem(this.CONSENT_KEY, 'granted');
  }
  
  static revokeConsent(): void {
    localStorage.setItem(this.CONSENT_KEY, 'revoked');
  }
  
  static isConsentRequired(): boolean {
    return analyticsConfig.requireConsent;
  }
}

// Enhanced analytics class
export class Analytics {
  private static instance: Analytics;
  private sessionStartTime: number = Date.now();
  private pageStartTime: number = Date.now();
  private currentStore: string | null = null;
  private userRole: string | null = null;
  
  private constructor() {
    this.initializeSession();
  }
  
  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }
  
  private initializeSession(): void {
    // Track session start
    if (this.shouldTrack()) {
      this.trackEvent('page_view', { 
        page: 'session_start',
        store_id: this.currentStore || undefined,
        user_role: this.userRole as any || undefined
      });
    }
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_view', { 
          page: 'page_hidden',
          store_id: this.currentStore || undefined
        });
      } else {
        this.pageStartTime = Date.now();
        this.trackEvent('page_view', { 
          page: 'page_visible',
          store_id: this.currentStore || undefined
        });
      }
    });
    
    // Track page unload
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
      this.trackEvent('user_logout', { 
        session_duration: sessionDuration,
        store_id: this.currentStore || undefined
      });
    });
  }
  
  private shouldTrack(): boolean {
    return analyticsConfig.enabled && ConsentManager.hasConsent();
  }
  
  private log(message: string, data?: any): void {
    if (analyticsConfig.debug) {
      console.log(`[Analytics] ${message}`, data);
    }
  }
  
  // Set current context
  setContext(storeId: string | null, userRole?: string): void {
    this.currentStore = storeId;
    this.userRole = userRole || null;
    this.log('Context updated', { storeId, userRole });
  }
  
  // Track custom events with type safety
  trackEvent<T extends keyof AnalyticsEvent>(
    event: T,
    properties: AnalyticsEvent[T]
  ): void {
    if (!this.shouldTrack()) {
      this.log('Tracking skipped (disabled or no consent)', { event, properties });
      return;
    }
    
    try {
      // Add common properties
      const enhancedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        ...(this.currentStore && { current_store: this.currentStore }),
        ...(this.userRole && { current_role: this.userRole }),
      };
      
      // Track with generic analytics (console logging for now)
      this.sendToAnalytics(event, enhancedProperties);
      
      this.log('Event tracked', { event, properties: enhancedProperties });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }
  
  // Track page views
  trackPageView(page: string, additionalData?: Record<string, any>): void {
    const pageDuration = Math.round((Date.now() - this.pageStartTime) / 1000);
    
    this.trackEvent('page_view', {
      page,
      store_id: this.currentStore || undefined,
      user_role: this.userRole as any || undefined,
      ...additionalData,
    });
    
    // Track previous page duration if not the first page
    if (pageDuration > 1) {
      this.trackEvent('performance_metric', {
        metric: 'page_load',
        value: pageDuration,
        context: `previous_page_duration`,
      });
    }
    
    this.pageStartTime = Date.now();
  }
  
  // Track performance metrics
  trackPerformance(metric: string, value: number, context?: string): void {
    // Sample performance events to reduce noise
    if (Math.random() > analyticsConfig.performanceSampleRate) {
      return;
    }
    
    this.trackEvent('performance_metric', {
      metric: metric as any,
      value,
      context,
    });
  }
  
  // Track errors
  trackError(error: Error | string, context?: {
    type?: 'api' | 'ui' | 'auth' | 'payment';
    page?: string;
    additionalData?: Record<string, any>;
  }): void {
    const errorMessage = error instanceof Error ? error.message : error;
    
    this.trackEvent('error_occurred', {
      error_type: context?.type || 'ui',
      error_message: errorMessage,
      page: context?.page || window.location.pathname,
      store_id: this.currentStore || undefined,
      ...context?.additionalData,
    });
  }
  
  // Track business metrics
  trackBusinessMetric(metric: {
    type: 'revenue' | 'transaction' | 'inventory' | 'customer';
    value: number;
    metadata?: Record<string, any>;
  }): void {
    this.trackEvent('feature_used', {
      feature: `business_metric_${metric.type}`,
      context: JSON.stringify({ value: metric.value, ...metric.metadata }),
      store_id: this.currentStore || undefined,
    });
  }

  // Generic analytics sender (replaces Vercel Analytics)
  private sendToAnalytics(event: string, properties: Record<string, any>): void {
    // In development, log to console
    if (import.meta.env.DEV) {
      console.log('📊 Analytics Event:', event, properties);
    }

    // In production, you can integrate with any analytics service here
    // Examples: Google Analytics, Mixpanel, PostHog, etc.
    if (import.meta.env.PROD) {
      // Example: Send to Google Analytics if available
      if (window.gtag) {
        window.gtag('event', event, properties);
      }

      // Example: Send to custom analytics endpoint
      try {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, properties })
        }).catch(() => {
          // Silently fail - analytics shouldn't break the app
        });
      } catch {
        // Silently fail
      }
    }
  }
}

// Convenience functions
export const analytics = Analytics.getInstance();

// Export consent manager
export { ConsentManager };

// Hook for React components
export const useAnalytics = () => {
  return {
    track: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackBusinessMetric: analytics.trackBusinessMetric.bind(analytics),
    setContext: analytics.setContext.bind(analytics),
    hasConsent: ConsentManager.hasConsent,
    grantConsent: ConsentManager.grantConsent,
    revokeConsent: ConsentManager.revokeConsent,
    isConsentRequired: ConsentManager.isConsentRequired,
  };
};
