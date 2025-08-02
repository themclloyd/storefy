import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { pageStateManager } from '@/lib/pageStateManager';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        session: null,
        loading: true,
        initialized: false,

        // Actions
        setUser: (user) => set({ user }, false, 'setUser'),
        
        setSession: (session) => set({ session, user: session?.user ?? null }, false, 'setSession'),
        
        setLoading: (loading) => set({ loading }, false, 'setLoading'),
        
        setInitialized: (initialized) => set({ initialized }, false, 'setInitialized'),

        signIn: async (email: string, password: string) => {
          try {
            set({ loading: true }, false, 'signIn:start');

            // Only log in development mode
            if (import.meta.env.DEV) {
              console.log('🔐 Starting sign in for:', email);
            }

            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) {
              // Only log error details in development
              if (import.meta.env.DEV) {
                console.error('🔐 Sign in error:', error);
              }
              throw error;
            }

            // Only log success in development
            if (import.meta.env.DEV) {
              console.log('🔐 Sign in successful:', data.user?.email);
            }

            // Directly update the store state with the user and session
            set({
              user: data.user,
              session: data.session,
              loading: false
            }, false, 'signIn:success');

            return { error: null };
          } catch (error) {
            // Only log error in development
            if (import.meta.env.DEV) {
              console.error('🔐 Sign in failed:', error);
            }
            set({ loading: false }, false, 'signIn:error');
            return { error: error instanceof Error ? error : new Error('Sign in failed') };
          }
        },

        signUp: async (email: string, password: string, displayName?: string) => {
          try {
            set({ loading: true }, false, 'signUp:start');
            
            const redirectUrl = `${window.location.origin}/dashboard`;

            const { error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: redirectUrl,
                data: {
                  display_name: displayName || email.split('@')[0]
                },
              }
            });
            
            return { error };
          } catch (error) {
            return { error: error instanceof Error ? error : new Error('Sign up failed') };
          } finally {
            set({ loading: false }, false, 'signUp:end');
          }
        },

        signOut: async () => {
          try {
            set({ loading: true }, false, 'signOut:start');
            
            // Clear page state when user signs out
            pageStateManager.clearPageState();

            await supabase.auth.signOut();
            
            set({ 
              user: null, 
              session: null, 
              loading: false 
            }, false, 'signOut:complete');
          } catch (error) {
            console.error('Sign out error:', error);
            set({ loading: false }, false, 'signOut:error');
          }
        },

        initialize: async () => {
          try {
            set({ loading: true, initialized: false }, false, 'initialize:start');

            // Get initial session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error && import.meta.env.DEV) {
              console.error('Auth initialization error:', error);
            }

            set({
              session,
              user: session?.user ?? null,
              loading: false,
              initialized: true
            }, false, 'initialize:complete');

            // Set up auth state listener
            if (import.meta.env.DEV) {
              console.log('🔐 Setting up auth state change listener...');
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              (event, session) => {
                if (import.meta.env.DEV) {
                  console.log('🔐 Auth state changed:', event, session?.user?.email);
                }

                set({
                  session,
                  user: session?.user ?? null,
                  loading: false
                }, false, `authStateChange:${event}`);
              }
            );

            if (import.meta.env.DEV) {
              console.log('🔐 Auth state change listener set up successfully');
            }

            // Return cleanup function
            return () => subscription.unsubscribe();
          } catch (error) {
            console.error('Auth initialization failed:', error);
            set({ 
              loading: false, 
              initialized: true 
            }, false, 'initialize:error');
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({ 
          // Only persist non-sensitive data
          initialized: state.initialized 
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Selectors for optimized re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useAuthInitialized = () => useAuthStore((state) => state.initialized);

// Individual action selectors to prevent infinite loops
export const useSignIn = () => useAuthStore((state) => state.signIn);
export const useSignUp = () => useAuthStore((state) => state.signUp);
export const useSignOut = () => useAuthStore((state) => state.signOut);
export const useAuthInitializeAction = () => useAuthStore((state) => state.initialize);

// Combined action selectors with proper memoization
export const useAuthActions = () => {
  const signIn = useSignIn();
  const signUp = useSignUp();
  const signOut = useSignOut();
  const initialize = useAuthInitializeAction();

  return useMemo(() => ({
    signIn,
    signUp,
    signOut,
    initialize,
  }), [signIn, signUp, signOut, initialize]);
};
