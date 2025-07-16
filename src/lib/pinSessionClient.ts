import { supabase } from '@/integrations/supabase/client';

interface PinSessionData {
  member_id: string;
  user_id: string | null;
  store_id: string;
  role: string;
  name: string;
  store_name: string;
  login_time: string;
}

/**
 * Custom Supabase client for PIN sessions that sets context variables
 * This maintains RLS security while allowing PIN session access
 */
class PinSessionClient {
  private pinData: PinSessionData | null = null;
  private contextSet = false;

  constructor() {
    this.loadPinSession();
  }

  private loadPinSession() {
    const pinSession = localStorage.getItem('pin_session');
    if (pinSession) {
      try {
        this.pinData = JSON.parse(pinSession);
      } catch (error) {
        console.error('Invalid PIN session data:', error);
        localStorage.removeItem('pin_session');
      }
    }
  }

  /**
   * Set PIN session context in the database for RLS policies
   */
  private async setPinContext(): Promise<void> {
    if (!this.pinData || this.contextSet) return;

    try {
      const { error } = await supabase.rpc('set_pin_session_context', {
        _member_id: this.pinData.member_id,
        _store_id: this.pinData.store_id,
        _role: this.pinData.role
      });

      if (error) {
        console.error('Failed to set PIN context:', error);
        throw error;
      }

      this.contextSet = true;
    } catch (error) {
      console.error('PIN context error:', error);
      throw error;
    }
  }

  /**
   * Initialize PIN context (call this before using the client)
   */
  async initialize(): Promise<void> {
    if (this.pinData && !this.contextSet) {
      await this.setPinContext();
    }
  }

  /**
   * Get data with PIN session context
   */
  from(table: string) {
    return supabase.from(table);
  }

  /**
   * Execute RPC with PIN session context
   */
  rpc(fn: string, args?: any) {
    return supabase.rpc(fn, args);
  }

  /**
   * Check if user has PIN session
   */
  hasPinSession(): boolean {
    return this.pinData !== null;
  }

  /**
   * Get PIN session data
   */
  getPinSession(): PinSessionData | null {
    return this.pinData;
  }

  /**
   * Clear PIN session
   */
  clearPinSession(): void {
    localStorage.removeItem('pin_session');
    this.pinData = null;
    this.contextSet = false;
  }

  /**
   * Refresh PIN session from localStorage
   */
  refreshPinSession(): void {
    this.loadPinSession();
    this.contextSet = false;
  }
}

// Export singleton instance
export const pinSessionClient = new PinSessionClient();

// Export regular supabase client for non-PIN operations
export { supabase };
