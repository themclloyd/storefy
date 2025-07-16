import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for data operations that automatically handles PIN sessions
 */
export function useStoreData() {
  const { user } = useAuth();

  // Check for PIN session
  const pinSession = localStorage.getItem('pin_session');
  const pinData = pinSession ? JSON.parse(pinSession) : null;
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
