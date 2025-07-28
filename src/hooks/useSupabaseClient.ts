import { useUser } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from '@/lib/sessionManager';

/**
 * Hook for data operations that automatically handles PIN sessions
 */
export function useStoreData() {
  const _user = useUser();

  // Check for PIN session using session manager
  const pinData = sessionManager.getPinSession();
  const isPinSession = pinData !== null;

  return {
    from: (table: string) => supabase.from(table),
    rpc: (fn: string, args?: any) => supabase.rpc(fn, args),
    isPinSession,
    pinData,
    currentStoreId: pinData?.store_id || null,
    userRole: pinData?.role || null
  };
}
