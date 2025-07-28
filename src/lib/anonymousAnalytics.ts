/**
 * Anonymous Analytics Collection System
 * 
 * This module handles privacy-first data collection for system analytics.
 * All data is collected anonymously without storing personal information.
 */

import { supabase } from '@/integrations/supabase/client';

// Types for anonymous events
interface AnonymousEvent {
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
  session_id: string; // Anonymous session identifier
  user_agent_hash: string; // Hashed user agent for device analytics
  ip_hash: string; // Hashed IP for geographic analytics
}

interface PrivacySettings {
  analyticsEnabled: boolean;
  performanceTracking: boolean;
  usageTracking: boolean;
  errorTracking: boolean;
  geographicTracking: boolean;
}

class AnonymousAnalyticsCollector {
  private sessionId: string;
  private privacySettings: PrivacySettings;
  private eventQueue: AnonymousEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.privacySettings = this.loadPrivacySettings();
    this.startEventFlushing();
  }

  /**
   * Generate anonymous session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load privacy settings from localStorage
   */
  private loadPrivacySettings(): PrivacySettings {
    const stored = localStorage.getItem('storefy_privacy_settings');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default privacy-first settings
    return {
      analyticsEnabled: true,
      performanceTracking: true,
      usageTracking: true,
      errorTracking: true,
      geographicTracking: false // Disabled by default for privacy
    };
  }

  /**
   * Update privacy settings
   */
  public updatePrivacySettings(settings: Partial<PrivacySettings>): void {
    this.privacySettings = { ...this.privacySettings, ...settings };
    localStorage.setItem('storefy_privacy_settings', JSON.stringify(this.privacySettings));
  }

  /**
   * Hash sensitive data for anonymous collection
   */
  private hashData(data: string): string {
    // Simple hash function for client-side (in production, use crypto.subtle)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get anonymous user agent hash
   */
  private getUserAgentHash(): string {
    return this.hashData(navigator.userAgent);
  }

  /**
   * Get anonymous IP hash (would be done server-side in production)
   */
  private getIPHash(): string {
    // In production, this would be handled server-side
    return this.hashData('anonymous_ip');
  }

  /**
   * Track anonymous event
   */
  public trackEvent(eventType: string, eventData: Record<string, any> = {}): void {
    if (!this.privacySettings.analyticsEnabled) {
      return;
    }

    // Remove any potentially identifying information
    const sanitizedData = this.sanitizeEventData(eventData);

    const event: AnonymousEvent = {
      event_type: eventType,
      event_data: sanitizedData,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_agent_hash: this.getUserAgentHash(),
      ip_hash: this.getIPHash()
    };

    this.eventQueue.push(event);
    console.log('📊 Anonymous event tracked:', eventType, sanitizedData);
  }

  /**
   * Remove potentially identifying information from event data
   */
  private sanitizeEventData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };
    
    // Remove common PII fields
    const piiFields = [
      'email', 'name', 'phone', 'address', 'user_id', 
      'customer_id', 'personal_info', 'credit_card'
    ];
    
    piiFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });

    // Hash any remaining potentially sensitive data
    if (sanitized.store_id) {
      sanitized.store_id_hash = this.hashData(sanitized.store_id);
      delete sanitized.store_id;
    }

    return sanitized;
  }

  /**
   * Track page view anonymously
   */
  public trackPageView(page: string): void {
    if (!this.privacySettings.usageTracking) return;

    this.trackEvent('page_view', {
      page,
      referrer: document.referrer ? this.hashData(document.referrer) : null,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    });
  }

  /**
   * Track feature usage anonymously
   */
  public trackFeatureUsage(feature: string, action: string, metadata: Record<string, any> = {}): void {
    if (!this.privacySettings.usageTracking) return;

    this.trackEvent('feature_usage', {
      feature,
      action,
      ...this.sanitizeEventData(metadata)
    });
  }

  /**
   * Track performance metrics anonymously
   */
  public trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    if (!this.privacySettings.performanceTracking) return;

    this.trackEvent('performance_metric', {
      metric,
      value,
      unit,
      browser: this.getBrowserInfo(),
      device_type: this.getDeviceType()
    });
  }

  /**
   * Track errors anonymously
   */
  public trackError(error: Error, context: string = ''): void {
    if (!this.privacySettings.errorTracking) return;

    this.trackEvent('error', {
      error_type: error.name,
      error_message: error.message,
      context,
      stack_trace_hash: error.stack ? this.hashData(error.stack) : null,
      browser: this.getBrowserInfo(),
      url_hash: this.hashData(window.location.pathname)
    });
  }

  /**
   * Get anonymous browser information
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  /**
   * Get anonymous device type
   */
  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'Mobile';
    return 'Desktop';
  }

  /**
   * Start periodic event flushing
   */
  private startEventFlushing(): void {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Flush events to storage/analytics service
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In production, you would send to an analytics service
      // For now, we'll store in a local analytics table
      console.log('📤 Flushing anonymous events:', eventsToFlush.length);
      
      // Store events locally for admin dashboard
      localStorage.setItem('anonymous_events', JSON.stringify(eventsToFlush));
      
      // In production, send to analytics service:
      // await this.sendToAnalyticsService(eventsToFlush);
      
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  /**
   * Get privacy settings
   */
  public getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  /**
   * Clear all collected data
   */
  public clearAllData(): void {
    this.eventQueue = [];
    localStorage.removeItem('anonymous_events');
    localStorage.removeItem('storefy_privacy_settings');
    console.log('🗑️ All anonymous analytics data cleared');
  }

  /**
   * Cleanup on page unload
   */
  public cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushEvents(); // Final flush
  }
}

// Global analytics instance
export const analytics = new AnonymousAnalyticsCollector();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  analytics.cleanup();
});

// Convenience functions for common tracking
export const trackPageView = (page: string) => analytics.trackPageView(page);
export const trackFeatureUsage = (feature: string, action: string, metadata?: Record<string, any>) => 
  analytics.trackFeatureUsage(feature, action, metadata);
export const trackPerformance = (metric: string, value: number, unit?: string) => 
  analytics.trackPerformance(metric, value, unit);
export const trackError = (error: Error, context?: string) => 
  analytics.trackError(error, context);

// Privacy management
export const updatePrivacySettings = (settings: Partial<PrivacySettings>) => 
  analytics.updatePrivacySettings(settings);
export const getPrivacySettings = () => analytics.getPrivacySettings();
export const clearAnalyticsData = () => analytics.clearAllData();

// Example usage tracking for common Storefy features
export const trackPOSTransaction = (amount: number, itemCount: number) => {
  trackFeatureUsage('pos', 'transaction_completed', {
    amount_range: amount < 50 ? 'small' : amount < 200 ? 'medium' : 'large',
    item_count_range: itemCount < 5 ? 'few' : itemCount < 20 ? 'medium' : 'many'
  });
};

export const trackInventoryUpdate = (action: 'add' | 'update' | 'delete') => {
  trackFeatureUsage('inventory', action);
};

export const trackReportView = (reportType: string) => {
  trackFeatureUsage('reports', 'view', { report_type: reportType });
};

export const trackStoreCreation = () => {
  trackFeatureUsage('stores', 'created');
};

export const trackUserRegistration = () => {
  trackFeatureUsage('auth', 'registration');
};

export const trackSubscriptionChange = (plan: string) => {
  trackFeatureUsage('subscription', 'plan_change', { plan_type: plan });
};
