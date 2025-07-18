import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { sessionManager } from '@/lib/sessionManager';

/**
 * Centralized app initialization that waits for all required context
 * before allowing the app to make decisions or render main content
 */

export type InitializationPhase = 
  | 'starting'           // App just started
  | 'checking-auth'      // Checking authentication state
  | 'checking-pin'       // Checking for PIN session
  | 'loading-stores'     // Loading store data
  | 'restoring-state'    // Restoring previous selections
  | 'ready'              // All context loaded, app ready
  | 'error';             // Initialization failed

export interface AppState {
  // Authentication state
  isAuthenticated: boolean;
  authType: 'supabase' | 'pin' | null;
  user: any | null;
  pinSession: any | null;
  
  // Store state
  hasStores: boolean;
  hasStoreSelection: boolean;
  
  // Initialization state
  phase: InitializationPhase;
  isReady: boolean;
  error: string | null;
}

interface AppInitializationContextType {
  appState: AppState;
  retryInitialization: () => void;
  isInitializing: boolean;
}

const AppInitializationContext = createContext<AppInitializationContextType | undefined>(undefined);

export function AppInitializationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<InitializationPhase>('starting');
  const [error, setError] = useState<string | null>(null);

  // Get PIN session data
  const pinSession = sessionManager.getPinSession();
  const hasPinSession = pinSession !== null;

  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    authType: null,
    user: null,
    pinSession: null,
    hasStores: false,
    hasStoreSelection: false,
    phase: 'starting',
    isReady: false,
    error: null,
  });

  // Main initialization sequence - use refs to prevent excessive re-runs
  const initializationRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const lastPinSessionRef = useRef<boolean>(false);

  useEffect(() => {
    // Only re-initialize if there's a meaningful change
    const currentUserId = user?.id || null;
    const hasUserChanged = lastUserIdRef.current !== currentUserId;
    const hasPinSessionChanged = lastPinSessionRef.current !== hasPinSession;

    // Skip if already initialized and no meaningful changes
    if (initializationRef.current && !hasUserChanged && !hasPinSessionChanged && !authLoading) {
      return;
    }

    // Update refs
    lastUserIdRef.current = currentUserId;
    lastPinSessionRef.current = hasPinSession;

    initializeApp();
  }, [user?.id, authLoading, hasPinSession]); // Only depend on user ID, not full user object

  const initializeApp = async () => {
    try {
      console.log('🚀 Starting app initialization...');
      setError(null);

      // Phase 1: Check authentication
      setPhase('checking-auth');
      console.log('📋 Phase 1: Checking authentication...', { 
        authLoading, 
        hasUser: !!user, 
        hasPinSession 
      });

      // Wait for auth to complete loading
      if (authLoading) {
        console.log('⏳ Waiting for auth to complete...');
        return; // Will re-run when authLoading changes
      }

      // Phase 2: Determine auth type
      setPhase('checking-pin');
      let authType: 'supabase' | 'pin' | null = null;
      let isAuthenticated = false;

      if (hasPinSession) {
        console.log('🔑 PIN session detected');
        authType = 'pin';
        isAuthenticated = true;
      } else if (user) {
        console.log('👤 Supabase user detected');
        authType = 'supabase';
        isAuthenticated = true;
      } else {
        console.log('❌ No authentication found');
        authType = null;
        isAuthenticated = false;
      }

      // Phase 3: Check for stored state (only for authenticated users)
      setPhase('restoring-state');
      let hasStoreSelection = false;

      if (isAuthenticated) {
        if (authType === 'pin') {
          // PIN users always have their store pre-selected
          hasStoreSelection = true;
          console.log('✅ PIN user has pre-selected store');
        } else if (authType === 'supabase') {
          // Check for stored store selection
          try {
            const stored = localStorage.getItem('storefy_selected_store');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.userId === user.id) {
                hasStoreSelection = true;
                console.log('✅ Found stored store selection for user');
              } else {
                console.log('🗑️ Stored selection for different user, clearing');
                localStorage.removeItem('storefy_selected_store');
              }
            }
          } catch (error) {
            console.error('❌ Error checking stored selection:', error);
          }
        }
      }

      // Phase 4: App is ready
      setPhase('ready');
      console.log('🎉 App initialization complete!');

      // Mark as initialized
      initializationRef.current = true;

      // Update final app state
      setAppState({
        isAuthenticated,
        authType,
        user,
        pinSession,
        hasStores: isAuthenticated, // Will be determined by StoreContext
        hasStoreSelection,
        phase: 'ready',
        isReady: true,
        error: null,
      });

    } catch (err) {
      console.error('❌ App initialization failed:', err);
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Initialization failed');
      setAppState(prev => ({
        ...prev,
        phase: 'error',
        isReady: false,
        error: err instanceof Error ? err.message : 'Initialization failed',
      }));
    }
  };

  const retryInitialization = () => {
    setPhase('starting');
    setError(null);
    initializeApp();
  };

  const isInitializing = phase !== 'ready' && phase !== 'error';

  // Update app state when phase changes
  useEffect(() => {
    setAppState(prev => ({
      ...prev,
      phase,
      isReady: phase === 'ready',
      error,
    }));
  }, [phase, error]);

  const value = {
    appState,
    retryInitialization,
    isInitializing,
  };

  return (
    <AppInitializationContext.Provider value={value}>
      {children}
    </AppInitializationContext.Provider>
  );
}

export function useAppInitialization() {
  const context = useContext(AppInitializationContext);
  if (context === undefined) {
    throw new Error('useAppInitialization must be used within an AppInitializationProvider');
  }
  return context;
}

// Helper hook for components that need to wait for initialization
export function useWaitForInitialization() {
  const { appState, isInitializing } = useAppInitialization();
  
  return {
    isReady: appState.isReady,
    isInitializing,
    appState,
    shouldWait: isInitializing || !appState.isReady,
  };
}
