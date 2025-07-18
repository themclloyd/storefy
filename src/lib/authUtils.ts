import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from './sessionManager';
import { pageStateManager } from './pageStateManager';

/**
 * Comprehensive authentication utilities for handling both Supabase and PIN sessions
 */

export interface AuthState {
  isAuthenticated: boolean;
  authType: 'supabase' | 'pin' | null;
  user: any | null;
  pinSession: any | null;
  sessionExpiry?: Date;
}

/**
 * Get current authentication state
 */
export async function getAuthState(): Promise<AuthState> {
  // Check PIN session first (for OS software, this is primary)
  const pinSession = sessionManager.getPinSession();
  
  if (pinSession) {
    return {
      isAuthenticated: true,
      authType: 'pin',
      user: null,
      pinSession,
      sessionExpiry: pinSession.expires_at ? new Date(pinSession.expires_at) : undefined
    };
  }

  // Check Supabase session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session && !error) {
      return {
        isAuthenticated: true,
        authType: 'supabase',
        user: session.user,
        pinSession: null,
        sessionExpiry: session.expires_at ? new Date(session.expires_at * 1000) : undefined
      };
    }
  } catch (error) {
    console.error('Error checking Supabase session:', error);
  }

  return {
    isAuthenticated: false,
    authType: null,
    user: null,
    pinSession: null
  };
}

/**
 * Check if user has valid authentication without redirecting
 */
export async function hasValidAuth(): Promise<boolean> {
  const authState = await getAuthState();
  return authState.isAuthenticated;
}

/**
 * Get current store ID from either auth type
 */
export async function getCurrentStoreId(): Promise<string | null> {
  const authState = await getAuthState();
  
  if (authState.authType === 'pin' && authState.pinSession) {
    return authState.pinSession.store_id;
  }
  
  // For Supabase users, store ID would come from user metadata or separate query
  // This would need to be implemented based on your data structure
  return null;
}

/**
 * Get current user role
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const authState = await getAuthState();
  
  if (authState.authType === 'pin' && authState.pinSession) {
    return authState.pinSession.role;
  }
  
  // For Supabase users, role would come from user metadata or separate query
  // This would need to be implemented based on your data structure
  return null;
}

/**
 * Gracefully handle session expiry
 */
export function handleSessionExpiry(redirectPath: string = '/'): void {
  // Clear all sessions
  sessionManager.clearPinSession();

  // Clear page state when session expires
  pageStateManager.clearPageState();

  // Clear Supabase session
  supabase.auth.signOut().catch(console.error);

  // Only redirect if not already on a login page
  const currentPath = window.location.pathname;
  const loginPaths = ['/auth', '/pin-login', '/store/', '/'];

  if (!loginPaths.some(path => currentPath.includes(path))) {
    // Use history API instead of direct location change
    window.history.pushState(null, '', redirectPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

/**
 * Extend current session if possible
 */
export async function extendSession(): Promise<boolean> {
  const authState = await getAuthState();
  
  if (authState.authType === 'pin') {
    sessionManager.refreshSession();
    return true;
  }
  
  if (authState.authType === 'supabase') {
    try {
      const { error } = await supabase.auth.refreshSession();
      return !error;
    } catch (error) {
      console.error('Error refreshing Supabase session:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Get session time remaining in minutes
 */
export async function getSessionTimeRemaining(): Promise<number | null> {
  const authState = await getAuthState();
  
  if (authState.sessionExpiry) {
    const now = new Date();
    const remaining = Math.floor((authState.sessionExpiry.getTime() - now.getTime()) / (1000 * 60));
    return Math.max(0, remaining);
  }
  
  return null;
}

/**
 * Check if session is about to expire (within warning threshold)
 */
export async function isSessionNearExpiry(warningMinutes: number = 5): Promise<boolean> {
  const remaining = await getSessionTimeRemaining();
  return remaining !== null && remaining <= warningMinutes;
}

/**
 * Safe logout that handles both auth types
 */
export async function safeLogout(): Promise<void> {
  try {
    // Clear PIN session
    sessionManager.clearPinSession();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear any other local storage items if needed
    // localStorage.removeItem('other-session-data');
    
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Always redirect to home page using history API
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

/**
 * Initialize session monitoring for the application
 */
export function initializeSessionMonitoring(): void {
  // Set up session expiry handlers
  sessionManager.onSessionExpired(() => {
    handleSessionExpiry();
  });

  // Set up session warning handlers
  sessionManager.onSessionWarning((minutesLeft) => {
    console.log(`Session expires in ${minutesLeft} minutes`);
    // Additional warning logic can be added here
  });

  // Listen for Supabase auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      // Handle Supabase session changes
      console.log('Supabase auth state changed:', event);
    }
  });
}

/**
 * Validate current session and redirect if invalid
 */
export async function validateSessionOrRedirect(allowedPaths: string[] = []): Promise<boolean> {
  const currentPath = window.location.pathname;
  
  // Skip validation for allowed paths
  if (allowedPaths.some(path => currentPath.includes(path))) {
    return true;
  }
  
  const hasAuth = await hasValidAuth();
  
  if (!hasAuth) {
    handleSessionExpiry();
    return false;
  }
  
  return true;
}

/**
 * Get user display name from current session
 */
export async function getUserDisplayName(): Promise<string | null> {
  const authState = await getAuthState();
  
  if (authState.authType === 'pin' && authState.pinSession) {
    return authState.pinSession.name;
  }
  
  if (authState.authType === 'supabase' && authState.user) {
    return authState.user.user_metadata?.display_name || authState.user.email;
  }
  
  return null;
}
