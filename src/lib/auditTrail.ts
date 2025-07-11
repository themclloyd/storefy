/**
 * Comprehensive Audit Trail System for Storefy
 */

import { supabase } from '@/integrations/supabase/client';
import { secureLog } from './security';

export interface AuditEvent {
  id?: string;
  event_type: AuditEventType;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  actor_id: string;
  actor_name: string;
  store_id: string;
  description: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  session_id?: string;
}

export type AuditEventType = 
  | 'user_management'
  | 'store_management'
  | 'product_management'
  | 'order_management'
  | 'customer_management'
  | 'financial_transaction'
  | 'security_event'
  | 'system_configuration'
  | 'data_export'
  | 'data_import'
  | 'authentication'
  | 'authorization';

export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'refund'
  | 'void';

/**
 * Audit Trail Manager
 */
export class AuditTrailManager {
  private auditQueue: AuditEvent[] = [];
  private isProcessing = false;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startProcessing();
  }

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'session_id' | 'ip_address' | 'user_agent'>): Promise<void> {
    const fullEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    };

    // Add to processing queue
    this.auditQueue.push(fullEvent);

    // Log for immediate visibility
    secureLog.info(`Audit: ${event.action} ${event.entity_type}`, {
      entity_id: event.entity_id,
      actor: event.actor_name,
      store_id: event.store_id
    });
  }

  /**
   * Start processing audit queue
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (true) {
      try {
        if (this.auditQueue.length > 0) {
          const events = this.auditQueue.splice(0, 10); // Process in batches
          await this.processBatch(events);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        secureLog.error('Error processing audit trail', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Process batch of audit events
   */
  private async processBatch(events: AuditEvent[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(events.map(event => ({
          event_type: event.event_type,
          entity_type: event.entity_type,
          entity_id: event.entity_id,
          action: event.action,
          actor_id: event.actor_id,
          actor_name: event.actor_name,
          store_id: event.store_id,
          description: event.description,
          old_values: event.old_values,
          new_values: event.new_values,
          metadata: event.metadata,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          session_id: event.session_id
        })));

      if (error) {
        secureLog.error('Failed to store audit events', error);
        // Re-queue events for retry
        this.auditQueue.unshift(...events);
      }
    } catch (error) {
      secureLog.error('Database error storing audit events', error);
      // Re-queue events for retry
      this.auditQueue.unshift(...events);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP (placeholder)
   */
  private async getClientIP(): Promise<string> {
    return 'unknown'; // In production, use actual IP detection
  }

  /**
   * Query audit trail
   */
  async queryAuditTrail(filters: {
    store_id?: string;
    entity_type?: string;
    entity_id?: string;
    actor_id?: string;
    action?: AuditAction;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<AuditEvent[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.store_id) query = query.eq('store_id', filters.store_id);
      if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
      if (filters.entity_id) query = query.eq('entity_id', filters.entity_id);
      if (filters.actor_id) query = query.eq('actor_id', filters.actor_id);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.start_date) query = query.gte('created_at', filters.start_date);
      if (filters.end_date) query = query.lte('created_at', filters.end_date);

      query = query.limit(filters.limit || 100);

      const { data, error } = await query;

      if (error) {
        secureLog.error('Failed to query audit trail', error);
        return [];
      }

      return data || [];
    } catch (error) {
      secureLog.error('Error querying audit trail', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(store_id: string, days: number = 30): Promise<{
    totalEvents: number;
    eventsByType: Record<AuditEventType, number>;
    eventsByAction: Record<AuditAction, number>;
    topActors: Array<{ actor_name: string; count: number }>;
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data: events } = await supabase
        .from('audit_logs')
        .select('event_type, action, actor_name')
        .eq('store_id', store_id)
        .gte('created_at', startDate);

      const stats = {
        totalEvents: events?.length || 0,
        eventsByType: {} as Record<AuditEventType, number>,
        eventsByAction: {} as Record<AuditAction, number>,
        topActors: [] as Array<{ actor_name: string; count: number }>
      };

      if (events) {
        // Count by type
        events.forEach(event => {
          stats.eventsByType[event.event_type] = (stats.eventsByType[event.event_type] || 0) + 1;
          stats.eventsByAction[event.action] = (stats.eventsByAction[event.action] || 0) + 1;
        });

        // Count by actor
        const actorCounts: Record<string, number> = {};
        events.forEach(event => {
          actorCounts[event.actor_name] = (actorCounts[event.actor_name] || 0) + 1;
        });

        stats.topActors = Object.entries(actorCounts)
          .map(([actor_name, count]) => ({ actor_name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }

      return stats;
    } catch (error) {
      secureLog.error('Failed to get audit stats', error);
      return {
        totalEvents: 0,
        eventsByType: {} as Record<AuditEventType, number>,
        eventsByAction: {} as Record<AuditAction, number>,
        topActors: []
      };
    }
  }
}

// Global audit trail manager
export const auditTrailManager = new AuditTrailManager();

// Convenience functions for common audit events
export const AuditLogger = {
  // User management
  userCreated: (userId: string, userName: string, storeId: string, actorId: string, actorName: string) =>
    auditTrailManager.logEvent({
      event_type: 'user_management',
      entity_type: 'user',
      entity_id: userId,
      action: 'create',
      actor_id: actorId,
      actor_name: actorName,
      store_id: storeId,
      description: `User ${userName} created`
    }),

  userUpdated: (userId: string, userName: string, storeId: string, actorId: string, actorName: string, oldValues: any, newValues: any) =>
    auditTrailManager.logEvent({
      event_type: 'user_management',
      entity_type: 'user',
      entity_id: userId,
      action: 'update',
      actor_id: actorId,
      actor_name: actorName,
      store_id: storeId,
      description: `User ${userName} updated`,
      old_values: oldValues,
      new_values: newValues
    }),

  // Product management
  productCreated: (productId: string, productName: string, storeId: string, actorId: string, actorName: string) =>
    auditTrailManager.logEvent({
      event_type: 'product_management',
      entity_type: 'product',
      entity_id: productId,
      action: 'create',
      actor_id: actorId,
      actor_name: actorName,
      store_id: storeId,
      description: `Product ${productName} created`
    }),

  productUpdated: (productId: string, productName: string, storeId: string, actorId: string, actorName: string, oldValues: any, newValues: any) =>
    auditTrailManager.logEvent({
      event_type: 'product_management',
      entity_type: 'product',
      entity_id: productId,
      action: 'update',
      actor_id: actorId,
      actor_name: actorName,
      store_id: storeId,
      description: `Product ${productName} updated`,
      old_values: oldValues,
      new_values: newValues
    }),

  // Order management
  orderCreated: (orderId: string, storeId: string, actorId: string, actorName: string, orderTotal: number) =>
    auditTrailManager.logEvent({
      event_type: 'order_management',
      entity_type: 'order',
      entity_id: orderId,
      action: 'create',
      actor_id: actorId,
      actor_name: actorName,
      store_id: storeId,
      description: `Order created with total $${orderTotal}`,
      metadata: { order_total: orderTotal }
    }),

  // Authentication
  userLogin: (userId: string, userName: string, storeId: string) =>
    auditTrailManager.logEvent({
      event_type: 'authentication',
      entity_type: 'session',
      entity_id: userId,
      action: 'login',
      actor_id: userId,
      actor_name: userName,
      store_id: storeId,
      description: `User ${userName} logged in`
    }),

  userLogout: (userId: string, userName: string, storeId: string) =>
    auditTrailManager.logEvent({
      event_type: 'authentication',
      entity_type: 'session',
      entity_id: userId,
      action: 'logout',
      actor_id: userId,
      actor_name: userName,
      store_id: storeId,
      description: `User ${userName} logged out`
    }),

  // Data export
  dataExported: (entityType: string, storeId: string, actorId: string, actorName: string, recordCount: number) =>
    auditTrailManager.logEvent({
      event_type: 'data_export',
      entity_type: entityType,
      entity_id: `export_${Date.now()}`,
      action: 'export',
      actor_id: actorId,
      actor_name: actorName,
      store_id: storeId,
      description: `Exported ${recordCount} ${entityType} records`,
      metadata: { record_count: recordCount }
    })
};
