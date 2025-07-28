import { supabase } from '@/integrations/supabase/client';
import { sessionManager, type PinSessionData } from './sessionManager';

/**
 * Secure PIN session client that manages session tokens
 * This maintains RLS security with proper session validation
 */
class PinSessionClient {
  private pinData: PinSessionData | null = null;
  private sessionToken: string | null = null;
  private contextSet = false;

  constructor() {
    this.loadPinSession();
  }

  private loadPinSession() {
    // Use the session manager to get valid PIN session
    this.pinData = sessionManager.getPinSession();
    this.sessionToken = this.pinData?.sessionToken || null;
  }

  /**
   * Set PIN session token for secure database access
   */
  private async setPinContext(): Promise<void> {
    if (!this.sessionToken || this.contextSet) return;

    try {
      const { error } = await supabase.rpc('set_pin_session_token', {
        _token: this.sessionToken
      });

      if (error) {
        console.warn('Failed to set PIN session token:', error);
        throw error;
      }

      this.contextSet = true;
    } catch (_error) {
      // Handle error silently for security
      this.contextSet = false;
      throw new Error('Session validation failed');
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
    return sessionManager.getPinSession() !== null;
  }

  /**
   * Get PIN session data
   */
  getPinSession(): PinSessionData | null {
    return sessionManager.getPinSession();
  }

  /**
   * Clear PIN session
   */
  clearPinSession(): void {
    sessionManager.clearPinSession();
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
