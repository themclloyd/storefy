/**
 * Security Event Alerting System for Storefy
 */

import { supabase } from '@/integrations/supabase/client';
import { secureLog } from './security';

export interface SecurityEvent {
  id?: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
  user_id?: string;
  store_id?: string;
  ip_address?: string;
  user_agent?: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export type SecurityEventType = 
  | 'auth_failure'
  | 'account_lockout'
  | 'suspicious_activity'
  | 'data_breach_attempt'
  | 'privilege_escalation'
  | 'unusual_access_pattern'
  | 'csrf_violation'
  | 'rate_limit_exceeded'
  | 'session_hijack_attempt'
  | 'malicious_input'
  | 'unauthorized_api_access';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Security Alert Manager
 */
export class SecurityAlertManager {
  private alertQueue: SecurityEvent[] = [];
  private isProcessing = false;
  private alertHandlers: Map<SecurityEventType, (event: SecurityEvent) => void> = new Map();

  constructor() {
    this.setupDefaultHandlers();
    this.startProcessing();
  }

  /**
   * Report a security event
   */
  async reportEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      resolved: false,
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    };

    // Add to queue for processing
    this.alertQueue.push(fullEvent);

    // Log immediately
    secureLog.warn(`Security Event: ${event.type}`, {
      severity: event.severity,
      title: event.title,
      metadata: event.metadata
    });

    // Handle critical events immediately
    if (event.severity === 'critical') {
      await this.handleCriticalEvent(fullEvent);
    }
  }

  /**
   * Register custom alert handler
   */
  registerHandler(eventType: SecurityEventType, handler: (event: SecurityEvent) => void): void {
    this.alertHandlers.set(eventType, handler);
  }

  /**
   * Process alert queue
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (true) {
      try {
        if (this.alertQueue.length > 0) {
          const event = this.alertQueue.shift()!;
          await this.processEvent(event);
        }
        
        // Wait before next processing cycle
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        secureLog.error('Error processing security alerts', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer on error
      }
    }
  }

  /**
   * Process individual security event
   */
  private async processEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store in database
      await this.storeEvent(event);

      // Execute custom handler if registered
      const handler = this.alertHandlers.get(event.type);
      if (handler) {
        handler(event);
      }

      // Send notifications based on severity
      await this.sendNotifications(event);

    } catch (error) {
      secureLog.error('Failed to process security event', error);
    }
  }

  /**
   * Store event in database
   */
  private async storeEvent(event: SecurityEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert({
          type: event.type,
          severity: event.severity,
          title: event.title,
          description: event.description,
          metadata: event.metadata,
          user_id: event.user_id,
          store_id: event.store_id,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          resolved: event.resolved
        });

      if (error) {
        secureLog.error('Failed to store security event', error);
      }
    } catch (error) {
      secureLog.error('Database error storing security event', error);
    }
  }

  /**
   * Handle critical security events
   */
  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    // For critical events, we might want to:
    // 1. Immediately notify administrators
    // 2. Temporarily lock down the system
    // 3. Force user re-authentication
    
    secureLog.error('CRITICAL SECURITY EVENT', event);

    // Show immediate user notification
    if (typeof window !== 'undefined') {
      this.showCriticalAlert(event);
    }

    // In a real implementation, you might:
    // - Send email/SMS to administrators
    // - Trigger incident response procedures
    // - Automatically apply security measures
  }

  /**
   * Show critical alert to user
   */
  private showCriticalAlert(event: SecurityEvent): void {
    // Create a modal or notification for critical security events
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed top-0 left-0 w-full h-full bg-red-600 text-white z-50 flex items-center justify-center';
    alertDiv.innerHTML = `
      <div class="bg-white text-red-600 p-6 rounded-lg max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">Security Alert</h2>
        <p class="mb-4">${event.title}</p>
        <p class="text-sm mb-4">${event.description}</p>
        <button onclick="this.parentElement.parentElement.remove()" 
                class="bg-red-600 text-white px-4 py-2 rounded">
          Acknowledge
        </button>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 30000);
  }

  /**
   * Send notifications based on severity
   */
  private async sendNotifications(event: SecurityEvent): Promise<void> {
    // In a real implementation, this would integrate with:
    // - Email services (SendGrid, AWS SES)
    // - SMS services (Twilio)
    // - Slack/Discord webhooks
    // - Push notifications
    
    switch (event.severity) {
      case 'critical':
        // Immediate notification to all administrators
        await this.notifyAdministrators(event);
        break;
      case 'high':
        // Notification to security team
        await this.notifySecurityTeam(event);
        break;
      case 'medium':
        // Log and queue for review
        await this.queueForReview(event);
        break;
      case 'low':
        // Just log
        break;
    }
  }

  /**
   * Setup default event handlers
   */
  private setupDefaultHandlers(): void {
    // Account lockout handler
    this.registerHandler('account_lockout', (event) => {
      secureLog.warn('Account lockout detected', event.metadata);
    });

    // Rate limiting handler
    this.registerHandler('rate_limit_exceeded', (event) => {
      secureLog.warn('Rate limit exceeded', event.metadata);
    });

    // CSRF violation handler
    this.registerHandler('csrf_violation', (event) => {
      secureLog.error('CSRF violation detected', event.metadata);
    });
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string> {
    try {
      // In a real implementation, you might use a service to get the real IP
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Notify administrators (placeholder)
   */
  private async notifyAdministrators(event: SecurityEvent): Promise<void> {
    secureLog.error('ADMIN NOTIFICATION REQUIRED', event);
    // Implement actual notification logic
  }

  /**
   * Notify security team (placeholder)
   */
  private async notifySecurityTeam(event: SecurityEvent): Promise<void> {
    secureLog.warn('SECURITY TEAM NOTIFICATION', event);
    // Implement actual notification logic
  }

  /**
   * Queue for review (placeholder)
   */
  private async queueForReview(event: SecurityEvent): Promise<void> {
    secureLog.info('QUEUED FOR SECURITY REVIEW', event);
    // Implement actual queuing logic
  }

  /**
   * Get security event statistics
   */
  async getSecurityStats(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    unresolvedEvents: number;
    eventsByType: Record<SecurityEventType, number>;
  }> {
    try {
      const { data: events } = await supabase
        .from('security_events')
        .select('type, severity, resolved')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const stats = {
        totalEvents: events?.length || 0,
        criticalEvents: events?.filter(e => e.severity === 'critical').length || 0,
        unresolvedEvents: events?.filter(e => !e.resolved).length || 0,
        eventsByType: {} as Record<SecurityEventType, number>
      };

      // Count events by type
      events?.forEach(event => {
        stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      secureLog.error('Failed to get security stats', error);
      return {
        totalEvents: 0,
        criticalEvents: 0,
        unresolvedEvents: 0,
        eventsByType: {} as Record<SecurityEventType, number>
      };
    }
  }
}

// Global security alert manager instance
export const securityAlertManager = new SecurityAlertManager();

// Convenience functions for common security events
export const SecurityAlerts = {
  authFailure: (email: string, reason: string) => 
    securityAlertManager.reportEvent({
      type: 'auth_failure',
      severity: 'medium',
      title: 'Authentication Failure',
      description: `Failed login attempt for ${email}: ${reason}`,
      metadata: { email, reason }
    }),

  accountLockout: (email: string, attempts: number) =>
    securityAlertManager.reportEvent({
      type: 'account_lockout',
      severity: 'high',
      title: 'Account Locked',
      description: `Account ${email} locked after ${attempts} failed attempts`,
      metadata: { email, attempts }
    }),

  suspiciousActivity: (description: string, metadata?: Record<string, any>) =>
    securityAlertManager.reportEvent({
      type: 'suspicious_activity',
      severity: 'high',
      title: 'Suspicious Activity Detected',
      description,
      metadata
    }),

  rateLimitExceeded: (endpoint: string, attempts: number) =>
    securityAlertManager.reportEvent({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      title: 'Rate Limit Exceeded',
      description: `Rate limit exceeded for ${endpoint}: ${attempts} attempts`,
      metadata: { endpoint, attempts }
    }),

  csrfViolation: (endpoint: string) =>
    securityAlertManager.reportEvent({
      type: 'csrf_violation',
      severity: 'high',
      title: 'CSRF Violation',
      description: `CSRF token validation failed for ${endpoint}`,
      metadata: { endpoint }
    })
};
