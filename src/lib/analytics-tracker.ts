import { supabase } from '@/integrations/supabase/client';

/**
 * Analytics tracker for showcase events
 */
export class ShowcaseAnalytics {
  private storeIdentifier: string;

  constructor(storeIdentifier: string) {
    this.storeIdentifier = storeIdentifier;
  }

  /**
   * Track a showcase view
   */
  async trackView(referrer?: string) {
    return this.trackEvent('view', undefined, referrer);
  }

  /**
   * Track a product click
   */
  async trackProductClick(productId: string, referrer?: string) {
    return this.trackEvent('product_click', productId, referrer);
  }

  /**
   * Track a share event
   */
  async trackShare(referrer?: string) {
    return this.trackEvent('share', undefined, referrer);
  }

  /**
   * Track a contact click
   */
  async trackContactClick(referrer?: string) {
    return this.trackEvent('contact_click', undefined, referrer);
  }

  /**
   * Generic event tracking
   */
  private async trackEvent(
    eventType: 'view' | 'product_click' | 'share' | 'contact_click',
    productId?: string,
    referrer?: string
  ) {
    try {
      // Get user agent and other browser info
      const userAgent = navigator.userAgent;
      const currentReferrer = referrer || document.referrer;

      // Insert analytics event
      const { error } = await supabase
        .from('showcase_analytics')
        .insert({
          store_id: this.storeIdentifier, // This will be resolved by the database function
          event_type: eventType,
          product_id: productId || null,
          user_agent: userAgent,
          referrer: currentReferrer || null,
        });

      if (error) {
        console.error('Analytics tracking error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Analytics tracking failed:', error);
      return false;
    }
  }
}

/**
 * Create analytics tracker for a store
 */
export function createAnalyticsTracker(storeIdentifier: string): ShowcaseAnalytics {
  return new ShowcaseAnalytics(storeIdentifier);
}

/**
 * Quick tracking functions for common events
 */
export const trackShowcaseView = (storeIdentifier: string, referrer?: string) => {
  const tracker = createAnalyticsTracker(storeIdentifier);
  return tracker.trackView(referrer);
};

export const trackProductClick = (storeIdentifier: string, productId: string, referrer?: string) => {
  const tracker = createAnalyticsTracker(storeIdentifier);
  return tracker.trackProductClick(productId, referrer);
};

export const trackShowcaseShare = (storeIdentifier: string, referrer?: string) => {
  const tracker = createAnalyticsTracker(storeIdentifier);
  return tracker.trackShare(referrer);
};

export const trackContactClick = (storeIdentifier: string, referrer?: string) => {
  const tracker = createAnalyticsTracker(storeIdentifier);
  return tracker.trackContactClick(referrer);
};

/**
 * Batch tracking for multiple events
 */
export const trackMultipleEvents = async (
  storeIdentifier: string,
  events: Array<{
    type: 'view' | 'product_click' | 'share' | 'contact_click';
    productId?: string;
    referrer?: string;
  }>
) => {
  const tracker = createAnalyticsTracker(storeIdentifier);
  const results = await Promise.allSettled(
    events.map(event => {
      switch (event.type) {
        case 'view':
          return tracker.trackView(event.referrer);
        case 'product_click':
          return tracker.trackProductClick(event.productId!, event.referrer);
        case 'share':
          return tracker.trackShare(event.referrer);
        case 'contact_click':
          return tracker.trackContactClick(event.referrer);
        default:
          return Promise.resolve(false);
      }
    })
  );

  return results.map(result => result.status === 'fulfilled' && result.value);
};

/**
 * Debounced tracking to prevent spam
 */
const trackingDebounce: { [key: string]: number } = {};

export const debouncedTrackEvent = (
  key: string,
  trackingFunction: () => Promise<boolean>,
  debounceMs: number = 1000
) => {
  const now = Date.now();
  const lastTracked = trackingDebounce[key] || 0;

  if (now - lastTracked > debounceMs) {
    trackingDebounce[key] = now;
    return trackingFunction();
  }

  return Promise.resolve(false);
};
