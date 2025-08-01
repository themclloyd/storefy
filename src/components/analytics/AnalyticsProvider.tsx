import { useEffect } from 'react';
import { usePageTracking } from '@/hooks/useAnalyticsTracking';
import { ConsentBanner } from './ConsentBanner';
import { analytics } from '@/utils/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  // Enable automatic page tracking
  usePageTracking();

  useEffect(() => {
    // Initialize error tracking
    const handleError = (event: ErrorEvent) => {
      analytics.trackError(event.error || event.message, {
        type: 'ui',
        page: window.location.pathname,
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError(event.reason, {
        type: 'api',
        page: window.location.pathname,
        additionalData: {
          type: 'unhandled_promise_rejection',
        },
      });
    };

    // Add global error listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Performance observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              analytics.trackPerformance('page_load', entry.startTime, 'lcp');
            }
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              analytics.trackPerformance('page_load', (entry as any).processingStart - entry.startTime, 'fid');
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0) {
            analytics.trackPerformance('page_load', clsValue, 'cls');
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Navigation timing
        window.addEventListener('load', () => {
          setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigation) {
              // DNS lookup time
              analytics.trackPerformance('page_load', navigation.domainLookupEnd - navigation.domainLookupStart, 'dns');
              
              // TCP connection time
              analytics.trackPerformance('page_load', navigation.connectEnd - navigation.connectStart, 'tcp');
              
              // Time to First Byte (TTFB)
              analytics.trackPerformance('page_load', navigation.responseStart - navigation.requestStart, 'ttfb');
              
              // DOM content loaded
              analytics.trackPerformance('page_load', navigation.domContentLoadedEventEnd - navigation.navigationStart, 'dom_content_loaded');
              
              // Full page load
              analytics.trackPerformance('page_load', navigation.loadEventEnd - navigation.navigationStart, 'full_load');
            }
          }, 0);
        });
      } catch (error) {
        console.warn('Performance observer not supported or failed to initialize:', error);
      }
    }

    // Track resource loading errors
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        analytics.trackError(`Resource failed to load: ${target.tagName}`, {
          type: 'ui',
          page: window.location.pathname,
          additionalData: {
            resource_type: target.tagName.toLowerCase(),
            resource_src: (target as any).src || (target as any).href,
          },
        });
      }
    };

    document.addEventListener('error', handleResourceError, true);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  return (
    <>
      {children}

      {/* Consent Banner for GDPR compliance */}
      <ConsentBanner />
    </>
  );
};
