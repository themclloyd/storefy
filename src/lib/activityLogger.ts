import { supabase } from '@/integrations/supabase/client';

export interface ActivityLogEntry {
  store_id: string;
  actor_id?: string | null;
  actor_name: string;
  action_type: string;
  target_type: string;
  target_id?: string;
  target_name?: string;
  description: string;
  metadata?: Record<string, any>;
}

export const logActivity = async (entry: ActivityLogEntry) => {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        store_id: entry.store_id,
        actor_id: entry.actor_id,
        actor_name: entry.actor_name,
        action_type: entry.action_type,
        target_type: entry.target_type,
        target_id: entry.target_id,
        target_name: entry.target_name,
        description: entry.description,
        metadata: entry.metadata
      });

    // Silently handle errors to avoid disrupting user experience
  } catch (error) {
    // Silently handle errors to avoid disrupting user experience
  }
};

// Predefined action types for consistency
export const ACTION_TYPES = {
  // Team member actions
  TEAM_MEMBER_ADDED: 'team_member_added',
  TEAM_MEMBER_UPDATED: 'team_member_updated',
  TEAM_MEMBER_DELETED: 'team_member_deleted',
  TEAM_MEMBER_ACTIVATED: 'team_member_activated',
  TEAM_MEMBER_DEACTIVATED: 'team_member_deactivated',
  
  // Authentication actions
  PIN_LOGIN: 'pin_login',
  PIN_CHANGED: 'pin_changed',
  
  // Store actions
  STORE_SETTINGS_UPDATED: 'store_settings_updated',
  
  // POS actions
  TRANSACTION_CREATED: 'transaction_created',
  TRANSACTION_VOIDED: 'transaction_voided',
  
  // Inventory actions
  PRODUCT_ADDED: 'product_added',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  STOCK_ADJUSTED: 'stock_adjusted',
  
  // Customer actions
  CUSTOMER_ADDED: 'customer_added',
  CUSTOMER_UPDATED: 'customer_updated',
  CUSTOMER_DELETED: 'customer_deleted'
} as const;

// Target types
export const TARGET_TYPES = {
  TEAM_MEMBER: 'team_member',
  STORE: 'store',
  TRANSACTION: 'transaction',
  PRODUCT: 'product',
  CUSTOMER: 'customer',
  SYSTEM: 'system'
} as const;

// Helper functions for common log entries
export const teamMemberLogs = {
  added: (storeId: string, actorName: string, memberName: string, role: string, actorId?: string) =>
    logActivity({
      store_id: storeId,
      actor_id: actorId,
      actor_name: actorName,
      action_type: ACTION_TYPES.TEAM_MEMBER_ADDED,
      target_type: TARGET_TYPES.TEAM_MEMBER,
      target_name: memberName,
      description: `${actorName} added ${memberName} as a ${role}`,
      metadata: { role }
    }),

  updated: (storeId: string, actorName: string, memberName: string, changes: Record<string, any>, actorId?: string) =>
    logActivity({
      store_id: storeId,
      actor_id: actorId,
      actor_name: actorName,
      action_type: ACTION_TYPES.TEAM_MEMBER_UPDATED,
      target_type: TARGET_TYPES.TEAM_MEMBER,
      target_name: memberName,
      description: `${actorName} updated ${memberName}'s information`,
      metadata: { changes }
    }),

  deleted: (storeId: string, actorName: string, memberName: string, role: string, actorId?: string) =>
    logActivity({
      store_id: storeId,
      actor_id: actorId,
      actor_name: actorName,
      action_type: ACTION_TYPES.TEAM_MEMBER_DELETED,
      target_type: TARGET_TYPES.TEAM_MEMBER,
      target_name: memberName,
      description: `${actorName} removed ${memberName} (${role}) from the team`,
      metadata: { role }
    }),

  pinLogin: (storeId: string, memberName: string, memberId: string) =>
    logActivity({
      store_id: storeId,
      actor_name: memberName,
      action_type: ACTION_TYPES.PIN_LOGIN,
      target_type: TARGET_TYPES.SYSTEM,
      target_id: memberId,
      target_name: memberName,
      description: `${memberName} logged in using PIN`,
      metadata: { login_method: 'pin' }
    })
};
