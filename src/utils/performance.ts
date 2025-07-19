/**
 * Performance monitoring utilities for 2025 standards
 * Implements Web Vitals, error tracking, and performance analytics
 */

// Try different import approaches for web-vitals v5
import * as webVitals from 'web-vitals';

// Performance metrics interface
interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

// Error tracking interface
interface ErrorEvent {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorEvent[] = [];
  private isInitialized = false;

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Check if browser supports performance monitoring
    if (typeof window === 'undefined' || !window.performance) {
      console.warn('Performance monitoring not supported in this environment');
      return;
    }

    this.setupWebVitals();
    this.setupErrorTracking();
    this.setupResourceMonitoring();
    this.setupNavigationTiming();

    this.isInitialized = true;
    console.log('📊 Performance monitoring initialized');
  }

  /**
   * Set up Web Vitals monitoring
   */
  private setupWebVitals(): void {
    try {
      // Check if web-vitals functions are available
      if (webVitals.onLCP) {
        // Largest Contentful Paint (LCP)
        webVitals.onLCP((metric) => {
          this.recordMetric('LCP', metric.value, this.getRating(metric.value, [2500, 4000]));
        });
      }

      if (webVitals.onFID) {
        // First Input Delay (FID)
        webVitals.onFID((metric) => {
          this.recordMetric('FID', metric.value, this.getRating(metric.value, [100, 300]));
        });
      }

      if (webVitals.onCLS) {
        // Cumulative Layout Shift (CLS)
        webVitals.onCLS((metric) => {
          this.recordMetric('CLS', metric.value, this.getRating(metric.value, [0.1, 0.25]));
        });
      }

      if (webVitals.onFCP) {
        // First Contentful Paint (FCP)
        webVitals.onFCP((metric) => {
          this.recordMetric('FCP', metric.value, this.getRating(metric.value, [1800, 3000]));
        });
      }

      if (webVitals.onTTFB) {
        // Time to First Byte (TTFB)
        webVitals.onTTFB((metric) => {
          this.recordMetric('TTFB', metric.value, this.getRating(metric.value, [800, 1800]));
        });
      }

      if (webVitals.onINP) {
        // Interaction to Next Paint (INP) - New metric for 2025
        webVitals.onINP((metric) => {
          this.recordMetric('INP', metric.value, this.getRating(metric.value, [200, 500]));
        });
      }

      console.log('📊 Web Vitals monitoring setup completed');
    } catch (error) {
      console.warn('Web Vitals monitoring setup failed:', error);
    }
  }

  /**
   * Set up error tracking
   */
  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // React error boundary integration
    window.addEventListener('react-error', (event: any) => {
      this.recordError({
        message: event.detail.message,
        stack: event.detail.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });
  }

  /**
   * Set up resource monitoring
   */
  private setupResourceMonitoring(): void {
    // Monitor resource loading performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resource.duration > 1000) {
            this.recordMetric(
              `Slow Resource: ${resource.name}`,
              resource.duration,
              'poor'
            );
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Set up navigation timing monitoring
   */
  private setupNavigationTiming(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        // DNS lookup time
        const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
        this.recordMetric('DNS Lookup', dnsTime, this.getRating(dnsTime, [50, 200]));

        // Connection time
        const connectionTime = navigation.connectEnd - navigation.connectStart;
        this.recordMetric('Connection', connectionTime, this.getRating(connectionTime, [100, 300]));

        // DOM content loaded
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
        this.recordMetric('DOM Content Loaded', domContentLoaded, this.getRating(domContentLoaded, [1500, 3000]));

        // Page load time
        const pageLoadTime = navigation.loadEventEnd - navigation.navigationStart;
        this.recordMetric('Page Load', pageLoadTime, this.getRating(pageLoadTime, [2000, 4000]));
      }
    });
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.metrics.push(metric);
    
    // Send to analytics in production
    if (import.meta.env.PROD) {
      this.sendMetricToAnalytics(metric);
    } else {
      console.log(`📊 Performance Metric: ${name} = ${value}ms (${rating})`);
    }
  }

  /**
   * Record an error
   */
  private recordError(error: ErrorEvent): void {
    this.errors.push(error);
    
    // Send to error tracking service in production
    if (import.meta.env.PROD) {
      this.sendErrorToTracking(error);
    } else {
      console.error('🚨 Error tracked:', error);
    }
  }

  /**
   * Get performance rating based on thresholds
   */
  private getRating(value: number, thresholds: [number, number]): 'good' | 'needs-improvement' | 'poor' {
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Send metric to analytics service
   */
  private sendMetricToAnalytics(metric: PerformanceMetric): void {
    // Integration with analytics services (Google Analytics, Vercel Analytics, etc.)
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_map: { metric_rating: metric.rating },
      });
    }

    // Vercel Analytics integration
    if (window.va) {
      window.va('track', 'Performance Metric', {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
      });
    }
  }

  /**
   * Send error to tracking service
   */
  private sendErrorToTracking(error: ErrorEvent): void {
    // Integration with error tracking services (Sentry, LogRocket, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(new Error(error.message), {
        extra: {
          stack: error.stack,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
        },
      });
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    metrics: PerformanceMetric[];
    errors: ErrorEvent[];
    summary: Record<string, any>;
  } {
    const summary = {
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length,
      averagePageLoad: this.getAverageMetric('Page Load'),
      averageLCP: this.getAverageMetric('LCP'),
      averageFID: this.getAverageMetric('FID'),
      averageCLS: this.getAverageMetric('CLS'),
      errorRate: this.errors.length / Math.max(this.metrics.length, 1),
    };

    return {
      metrics: this.metrics,
      errors: this.errors,
      summary,
    };
  }

  /**
   * Get average value for a specific metric
   */
  private getAverageMetric(metricName: string): number {
    const metricValues = this.metrics
      .filter(m => m.name === metricName)
      .map(m => m.value);
    
    return metricValues.length > 0 
      ? metricValues.reduce((a, b) => a + b, 0) / metricValues.length 
      : 0;
  }

  /**
   * Clear stored metrics and errors
   */
  clear(): void {
    this.metrics = [];
    this.errors = [];
  }
}

// React Error Boundary for performance monitoring
export class PerformanceErrorBoundary extends Error {
  constructor(message: string, public componentStack?: string) {
    super(message);
    this.name = 'PerformanceErrorBoundary';
  }
}

// Performance monitoring hook for React components
export function usePerformanceMonitoring(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();

  const trackComponentRender = () => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      monitor['recordMetric'](`Component Render: ${componentName}`, renderTime, 
        renderTime < 16 ? 'good' : renderTime < 50 ? 'needs-improvement' : 'poor'
      );
    };
  };

  const trackUserInteraction = (interactionName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      monitor['recordMetric'](`Interaction: ${componentName}.${interactionName}`, interactionTime,
        interactionTime < 100 ? 'good' : interactionTime < 300 ? 'needs-improvement' : 'poor'
      );
    };
  };

  return {
    trackComponentRender,
    trackUserInteraction,
  };
}

// Initialize performance monitoring
export function initializePerformanceMonitoring(): void {
  const monitor = PerformanceMonitor.getInstance();
  monitor.initialize();
  
  // Make performance data available in development
  if (import.meta.env.DEV) {
    (window as any).performanceMonitor = monitor;
  }
}
