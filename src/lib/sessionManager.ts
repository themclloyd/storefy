import { supabase } from '@/integrations/supabase/client';

interface PinSessionData {
  member_id: string;
  user_id: string | null;
  store_id: string;
  role: string;
  name: string;
  store_name: string;
  login_time: string;
  last_activity?: string;
  expires_at?: string;
}

interface SessionConfig {
  pinSessionTimeout: number; // in minutes
  supabaseSessionTimeout: number; // in minutes
  activityCheckInterval: number; // in milliseconds
  warningBeforeExpiry: number; // in minutes
}

class SessionManager {
  private static instance: SessionManager;
  private config: SessionConfig;
  private activityTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private sessionWarningCallback?: (minutesLeft: number) => void;
  private sessionExpiredCallback?: () => void;
  private throttledActivityHandler: (() => void) | null = null;

  private constructor() {
    // Get timeout from environment or use defaults
    const envTimeout = import.meta.env.VITE_SESSION_TIMEOUT;
    const defaultTimeout = envTimeout ? parseInt(envTimeout) / 60 : 480; // 8 hours default

    this.config = {
      pinSessionTimeout: defaultTimeout, // 8 hours for PIN sessions
      supabaseSessionTimeout: 60, // 1 hour for Supabase sessions (handled by Supabase)
      activityCheckInterval: 60000, // Check every minute
      warningBeforeExpiry: 5, // Warn 5 minutes before expiry
    };

    this.initializeActivityTracking();
    this.startSessionMonitoring();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize activity tracking for session extension
   */
  private initializeActivityTracking(): void {
    // Clean up existing listeners first
    this.cleanupActivityTracking();

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const updateActivity = () => {
      this.lastActivity = Date.now();
      this.extendCurrentSession();
    };

    // Throttle activity updates to avoid excessive calls
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledUpdate = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        updateActivity();
        throttleTimer = null;
      }, 30000); // Update at most every 30 seconds
    };

    // Store the throttled function for cleanup
    this.throttledActivityHandler = throttledUpdate;

    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true, capture: true });
    });
  }

  /**
   * Clean up activity tracking listeners
   */
  private cleanupActivityTracking(): void {
    if (this.throttledActivityHandler) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.removeEventListener(event, this.throttledActivityHandler, { capture: true });
      });
      this.throttledActivityHandler = null;
    }
  }

  /**
   * Start monitoring sessions for expiry
   */
  private startSessionMonitoring(): void {
    // Clear existing timer first
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }

    this.activityTimer = setInterval(() => {
      this.checkSessionExpiry();
    }, this.config.activityCheckInterval);
  }

  /**
   * Clean up all timers and event listeners
   */
  public cleanup(): void {
    this.cleanupActivityTracking();

    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Check if current sessions are expired
   */
  private checkSessionExpiry(): void {
    const pinSession = this.getPinSession();
    
    if (pinSession) {
      const expiresAt = pinSession.expires_at ? new Date(pinSession.expires_at) : null;
      const now = new Date();
      
      if (expiresAt) {
        const minutesLeft = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));
        
        if (minutesLeft <= 0) {
          this.handleSessionExpiry();
          return;
        }
        
        if (minutesLeft <= this.config.warningBeforeExpiry && !this.warningTimer) {
          this.showSessionWarning(minutesLeft);
        }
      }
    }
  }

  /**
   * Extend the current session based on activity
   */
  private extendCurrentSession(): void {
    const pinSession = this.getPinSession();
    
    if (pinSession) {
      const now = new Date();
      const updatedSession: PinSessionData = {
        ...pinSession,
        last_activity: now.toISOString(),
        expires_at: new Date(now.getTime() + this.config.pinSessionTimeout * 60 * 1000).toISOString()
      };
      
      localStorage.setItem('pin_session', JSON.stringify(updatedSession));
    }
  }

  /**
   * Create a new PIN session with proper expiry
   */
  public createPinSession(sessionData: Omit<PinSessionData, 'last_activity' | 'expires_at'>): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.pinSessionTimeout * 60 * 1000);
    
    const fullSessionData: PinSessionData = {
      ...sessionData,
      last_activity: now.toISOString(),
      expires_at: expiresAt.toISOString()
    };
    
    localStorage.setItem('pin_session', JSON.stringify(fullSessionData));
    
    // Trigger session change event
    window.dispatchEvent(new CustomEvent('pin-session-changed'));
  }

  /**
   * Get current PIN session if valid
   */
  public getPinSession(): PinSessionData | null {
    try {
      const pinSession = localStorage.getItem('pin_session');
      if (!pinSession) return null;
      
      const sessionData: PinSessionData = JSON.parse(pinSession);
      
      // Check if session has expired
      if (sessionData.expires_at) {
        const expiresAt = new Date(sessionData.expires_at);
        if (new Date() > expiresAt) {
          this.clearPinSession();
          return null;
        }
      }
      
      return sessionData;
    } catch (error) {
      console.error('Invalid PIN session data:', error);
      this.clearPinSession();
      return null;
    }
  }

  /**
   * Check if user has a valid session (PIN or Supabase)
   */
  public async hasValidSession(): Promise<boolean> {
    // Check PIN session first
    const pinSession = this.getPinSession();
    if (pinSession) return true;
    
    // Check Supabase session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear PIN session
   */
  public clearPinSession(): void {
    localStorage.removeItem('pin_session');

    // Clear page state when PIN session is cleared
    try {
      const { pageStateManager } = require('./pageStateManager');
      pageStateManager.clearPageState();
    } catch (error) {
      // Ignore if pageStateManager is not available (circular dependency prevention)
    }

    window.dispatchEvent(new CustomEvent('pin-session-changed'));
  }

  /**
   * Handle session expiry
   */
  private handleSessionExpiry(): void {
    this.clearPinSession();
    
    if (this.sessionExpiredCallback) {
      this.sessionExpiredCallback();
    }
  }

  /**
   * Show session warning
   */
  private showSessionWarning(minutesLeft: number): void {
    if (this.sessionWarningCallback) {
      this.sessionWarningCallback(minutesLeft);
    }
    
    // Set timer to clear warning
    this.warningTimer = setTimeout(() => {
      this.warningTimer = null;
    }, 60000); // Clear warning after 1 minute
  }

  /**
   * Set callback for session warnings
   */
  public onSessionWarning(callback: (minutesLeft: number) => void): void {
    this.sessionWarningCallback = callback;
  }

  /**
   * Set callback for session expiry
   */
  public onSessionExpired(callback: () => void): void {
    this.sessionExpiredCallback = callback;
  }

  /**
   * Manually refresh session
   */
  public refreshSession(): void {
    this.extendCurrentSession();
  }

  /**
   * Get session info for debugging
   */
  public getSessionInfo(): { 
    hasPinSession: boolean; 
    pinExpiresAt?: string; 
    minutesLeft?: number;
    lastActivity: string;
  } {
    const pinSession = this.getPinSession();
    const info: any = {
      hasPinSession: !!pinSession,
      lastActivity: new Date(this.lastActivity).toISOString()
    };
    
    if (pinSession?.expires_at) {
      info.pinExpiresAt = pinSession.expires_at;
      info.minutesLeft = Math.floor((new Date(pinSession.expires_at).getTime() - Date.now()) / (1000 * 60));
    }
    
    return info;
  }


}

export const sessionManager = SessionManager.getInstance();
export type { PinSessionData, SessionConfig };
