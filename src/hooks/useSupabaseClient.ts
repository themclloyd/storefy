/**
 * Custom hook for Supabase client with store context
 * Provides a unified interface for database operations with store-specific context
 */

import { supabase } from '@/integrations/supabase/client';
import { useCurrentStore } from '@/stores/storeStore';
import { useUser } from '@/stores/authStore';
import { sessionManager } from '@/lib/sessionManager';

/**
 * Hook that provides Supabase client with store context
 */
export function useSupabaseClient() {
  const currentStore = useCurrentStore();
  const user = useUser();
  const pinSession = sessionManager.getPinSession();

  // Get current store ID from various sources
  const currentStoreId = currentStore?.id || pinSession?.storeId || null;
  
  // Check if user is in PIN session
  const isPinSession = !!pinSession && !user;

  // Create a wrapper for the 'from' method that includes store context
  const from = (table: string) => {
    return supabase.from(table);
  };

  return {
    // Supabase client instance
    supabase,
    
    // Table query helper
    from,
    
    // Store context
    currentStoreId,
    
    // Session information
    user,
    isPinSession,
    pinSession,
    
    // Auth helpers
    auth: supabase.auth,
    
    // Storage helpers
    storage: supabase.storage,
  };
}

/**
 * Hook for store-specific data operations
 */
export function useStoreData() {
  const { from, currentStoreId } = useSupabaseClient();

  const getStoreData = async (table: string, filters?: Record<string, any>) => {
    if (!currentStoreId) {
      throw new Error('No store selected');
    }

    let query = from(table).select('*').eq('store_id', currentStoreId);

    // Apply additional filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    return query;
  };

  const insertStoreData = async (table: string, data: Record<string, any>) => {
    if (!currentStoreId) {
      throw new Error('No store selected');
    }

    return from(table).insert({
      ...data,
      store_id: currentStoreId,
    });
  };

  const updateStoreData = async (
    table: string, 
    id: string, 
    data: Record<string, any>
  ) => {
    if (!currentStoreId) {
      throw new Error('No store selected');
    }

    return from(table)
      .update(data)
      .eq('id', id)
      .eq('store_id', currentStoreId);
  };

  const deleteStoreData = async (table: string, id: string) => {
    if (!currentStoreId) {
      throw new Error('No store selected');
    }

    return from(table)
      .delete()
      .eq('id', id)
      .eq('store_id', currentStoreId);
  };

  return {
    getStoreData,
    insertStoreData,
    updateStoreData,
    deleteStoreData,
    currentStoreId,
  };
}
