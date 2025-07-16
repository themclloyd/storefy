import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  event_type: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_agent?: string;
  ip_address?: string;
  timestamp: string;
}

export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private storeId: string | null = null;

  private constructor() {}

  public static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  public setStoreId(storeId: string) {
    this.storeId = storeId;
  }

  public async logEvent(event: Omit<SecurityEvent, 'timestamp' | 'user_agent'>): Promise<void> {
    if (!this.storeId) {
      return;
    }

    try {
      const eventData: SecurityEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      };

      // Database logging for security events
      try {
        await supabase.rpc('log_security_event', {
          _store_id: this.storeId,
          _event_type: event.event_type,
          _details: {
            ...eventData.details,
            severity: event.severity,
            user_agent: eventData.user_agent,
            timestamp: eventData.timestamp
          }
        });
      } catch (dbError) {
        // Silently fail database logging to avoid disrupting user experience
      }

      // Log critical events to external monitoring (if configured)
      if (event.severity === 'critical') {
        this.logCriticalEvent(eventData);
      }

    } catch (error) {
      // Silently handle logging errors to avoid disrupting user experience
    }
  }

  private async logCriticalEvent(event: SecurityEvent): Promise<void> {
    // In a production environment, you might want to send critical events
    // to external monitoring services like Sentry, DataDog, etc.
    // For now, we'll handle this silently to avoid console pollution
    try {
      // TODO: Implement external monitoring service integration
      // Example: await sendToSentry(event);
    } catch (error) {
      // Silently handle monitoring service errors
    }
  }

  // Specific logging methods for common security events
  public async logUnauthorizedAccess(details: {
    attempted_action: string;
    resource?: string;
    user_role?: string;
    page?: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'unauthorized_access',
      details,
      severity: 'high'
    });
  }

  public async logSuccessfulLogin(details: {
    login_method: 'email' | 'pin';
    user_role: string;
    member_name?: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'successful_login',
      details,
      severity: 'low'
    });
  }

  public async logFailedLogin(details: {
    login_method: 'email' | 'pin';
    failure_reason: string;
    attempted_credentials?: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'failed_login',
      details,
      severity: 'medium'
    });
  }

  public async logPermissionEscalation(details: {
    attempted_permission: string;
    current_role: string;
    required_role: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'permission_escalation_attempt',
      details,
      severity: 'critical'
    });
  }

  public async logDataAccess(details: {
    resource: string;
    action: 'read' | 'write' | 'delete';
    record_count?: number;
    sensitive_data?: boolean;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'data_access',
      details,
      severity: details.sensitive_data ? 'medium' : 'low'
    });
  }

  public async logConfigurationChange(details: {
    setting: string;
    old_value?: any;
    new_value?: any;
    changed_by_role: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'configuration_change',
      details,
      severity: 'medium'
    });
  }

  public async logSuspiciousActivity(details: {
    activity_type: string;
    description: string;
    risk_level: 'low' | 'medium' | 'high';
  }): Promise<void> {
    await this.logEvent({
      event_type: 'suspicious_activity',
      details,
      severity: details.risk_level === 'high' ? 'critical' : 'high'
    });
  }

  public async logSessionEvent(details: {
    event: 'start' | 'end' | 'timeout' | 'invalid';
    session_type: 'email' | 'pin';
    duration_minutes?: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'session_event',
      details,
      severity: details.event === 'invalid' ? 'high' : 'low'
    });
  }

  public async logTransactionEvent(details: {
    transaction_id?: string;
    amount?: number;
    payment_method?: string;
    action: 'create' | 'modify' | 'void' | 'refund';
    performed_by_role: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'transaction_event',
      details,
      severity: ['void', 'refund'].includes(details.action) ? 'medium' : 'low'
    });
  }

  public async logInventoryEvent(details: {
    product_id?: string;
    action: 'create' | 'update' | 'delete' | 'stock_adjustment';
    quantity_change?: number;
    performed_by_role: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'inventory_event',
      details,
      severity: details.action === 'delete' ? 'medium' : 'low'
    });
  }

  public async logReportAccess(details: {
    report_type: string;
    date_range?: string;
    sensitive_financial_data: boolean;
    accessed_by_role: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'report_access',
      details,
      severity: details.sensitive_financial_data ? 'medium' : 'low'
    });
  }
}

// Export singleton instance
export const securityAudit = SecurityAuditLogger.getInstance();

// Utility functions for common security checks
export function validateUserAgent(userAgent: string): boolean {
  // Basic validation to detect potentially malicious user agents
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /hack/i,
    /exploit/i
  ];

  return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

export function detectSuspiciousActivity(events: SecurityEvent[]): boolean {
  // Analyze recent events for suspicious patterns
  const recentEvents = events.filter(event => {
    const eventTime = new Date(event.timestamp);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return eventTime > fiveMinutesAgo;
  });

  // Check for rapid failed login attempts
  const failedLogins = recentEvents.filter(event => 
    event.event_type === 'failed_login'
  );

  if (failedLogins.length >= 5) {
    return true;
  }

  // Check for multiple unauthorized access attempts
  const unauthorizedAttempts = recentEvents.filter(event => 
    event.event_type === 'unauthorized_access'
  );

  if (unauthorizedAttempts.length >= 3) {
    return true;
  }

  return false;
}

export function generateSecurityReport(events: SecurityEvent[]): {
  summary: {
    total_events: number;
    critical_events: number;
    high_severity_events: number;
    failed_logins: number;
    unauthorized_attempts: number;
  };
  recommendations: string[];
} {
  const summary = {
    total_events: events.length,
    critical_events: events.filter(e => e.severity === 'critical').length,
    high_severity_events: events.filter(e => e.severity === 'high').length,
    failed_logins: events.filter(e => e.event_type === 'failed_login').length,
    unauthorized_attempts: events.filter(e => e.event_type === 'unauthorized_access').length,
  };

  const recommendations: string[] = [];

  if (summary.failed_logins > 10) {
    recommendations.push('Consider implementing account lockout after multiple failed login attempts');
  }

  if (summary.unauthorized_attempts > 5) {
    recommendations.push('Review user permissions and consider additional access controls');
  }

  if (summary.critical_events > 0) {
    recommendations.push('Investigate critical security events immediately');
  }

  return { summary, recommendations };
}
