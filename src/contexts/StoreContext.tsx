import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { securityAudit } from '@/utils/securityAudit';

interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  currency: string;
  tax_rate: number;
  owner_id: string;
  store_code?: string;
  role?: string;
}

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  userRole: string | null;
  loading: boolean;
  selectStore: (storeId: string) => void;
  updateCurrentStore: (updatedStore: Partial<Store>) => void;
  refreshStores: () => Promise<void>;
  isOwner: boolean;
  canManage: boolean;
  clearStoreSelection: () => void;
  hasValidStoreSelection: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Store selection persistence key
const STORE_SELECTION_KEY = 'storefy_selected_store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Check for PIN session first
  const pinSession = localStorage.getItem('pin_session');
  const pinData = pinSession ? JSON.parse(pinSession) : null;

  // For main users, try to restore store selection from localStorage
  const getStoredStoreSelection = () => {
    if (pinData) return null; // PIN users don't use stored selection
    if (!user) return null;

    try {
      const stored = localStorage.getItem(STORE_SELECTION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that the stored selection belongs to the current user
        if (parsed.userId === user.id) {
          return parsed.storeId;
        }
      }
    } catch (error) {
      console.error('Error reading stored store selection:', error);
    }
    return null;
  };

  // Initialize state with PIN session data if available
  const [stores, setStores] = useState<Store[]>(() => {
    if (pinData) {
      return [{
        id: pinData.store_id,
        name: pinData.store_name,
        currency: 'USD',
        tax_rate: 0,
        owner_id: '',
        role: pinData.role
      }];
    }
    return [];
  });

  const [currentStore, setCurrentStore] = useState<Store | null>(() => {
    if (pinData) {
      return {
        id: pinData.store_id,
        name: pinData.store_name,
        currency: 'USD',
        tax_rate: 0,
        owner_id: '',
        role: pinData.role
      };
    }
    return null;
  });

  const [userRole, setUserRole] = useState<string | null>(() => {
    return pinData ? pinData.role : null;
  });

  const [loading, setLoading] = useState(() => {
    // If we have PIN data, we don't need to load
    return !pinData;
  });

  const isOwner = pinData ? pinData.role === 'owner' : currentStore?.owner_id === user?.id;
  const canManage = isOwner || userRole === 'manager';

  const fetchStores = async () => {
    // Check for PIN session
    const pinSession = localStorage.getItem('pin_session');
    const pinData = pinSession ? JSON.parse(pinSession) : null;

    if (!user && !pinData) {
      setStores([]);
      setCurrentStore(null);
      setLoading(false);
      return;
    }

    try {
      // Handle PIN session - immediate store setup
      if (pinData && !user) {
        // For PIN sessions, we already have the store info
        const store: Store = {
          id: pinData.store_id,
          name: pinData.store_name,
          currency: 'USD', // Default values - could be fetched if needed
          tax_rate: 0,
          owner_id: '', // Not relevant for PIN sessions
          role: pinData.role
        };

        setStores([store]);
        setCurrentStore(store);
        setUserRole(pinData.role);
        setLoading(false);

        // Set store ID for security audit logging (disabled for now)
        securityAudit.setStoreId(store.id);

        // Log PIN session start (disabled to avoid console errors)
        // securityAudit.logSessionEvent({
        //   event: 'start',
        //   session_type: 'pin',
        //   duration_minutes: 0
        // });

        return;
      }

      // Handle regular authenticated user
      if (user) {
        // Get stores where user is owner
        const { data: ownedStores } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', user.id);

        // Get stores where user is a member
        const { data: memberStores } = await supabase
          .from('store_members')
          .select(`
            store_id,
            role,
            stores (*)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        // Combine stores and remove duplicates (user could be both owner and member)
        const storeMap = new Map<string, Store>();

        // Add owned stores first (owner role takes precedence)
        (ownedStores || []).forEach(store => {
          storeMap.set(store.id, { ...store, role: 'owner' });
        });

        // Add member stores (only if not already added as owner)
        (memberStores || []).forEach(member => {
          if (!storeMap.has(member.store_id)) {
            storeMap.set(member.store_id, {
              ...member.stores,
              role: member.role
            });
          }
        });

        const allStores: Store[] = Array.from(storeMap.values());
        setStores(allStores);

        // Don't auto-select stores for main users - they must explicitly choose
        // This ensures proper store selection enforcement
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectStore = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      setCurrentStore(store);
      setUserRole(store.role || null);

      // For main users (not PIN users), persist store selection
      if (!pinData && user) {
        try {
          localStorage.setItem(STORE_SELECTION_KEY, JSON.stringify({
            storeId: store.id,
            userId: user.id,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.error('Error storing store selection:', error);
        }
      }

      // Set store ID for security audit logging (disabled for now)
      securityAudit.setStoreId(store.id);

      // Log store selection (disabled to avoid console errors)
      // securityAudit.logSessionEvent({
      //   event: 'start',
      //   session_type: pinData ? 'pin' : 'email',
      //   duration_minutes: 0
      // });
    }
  };

  const clearStoreSelection = () => {
    setCurrentStore(null);
    setUserRole(null);

    // Clear stored selection for main users
    if (!pinData) {
      try {
        localStorage.removeItem(STORE_SELECTION_KEY);
      } catch (error) {
        console.error('Error clearing store selection:', error);
      }
    }
  };

  const updateCurrentStore = (updatedStore: Partial<Store>) => {
    if (currentStore) {
      const newStore = { ...currentStore, ...updatedStore };
      setCurrentStore(newStore);

      // Also update the store in the stores array
      setStores(prevStores =>
        prevStores.map(store =>
          store.id === currentStore.id ? newStore : store
        )
      );
    }
  };

  const refreshStores = async () => {
    setLoading(true);
    await fetchStores();
  };

  useEffect(() => {
    if (user) {
      fetchStores();
    } else {
      // User logged out, clear everything
      setStores([]);
      setCurrentStore(null);
      setUserRole(null);
      setLoading(false);
      clearStoreSelection();
    }
  }, [user]);

  // Auto-restore store selection for main users
  useEffect(() => {
    if (pinData || !user || stores.length === 0 || currentStore) {
      return; // Skip for PIN users, no user, no stores, or already have selection
    }

    const storedStoreId = getStoredStoreSelection();
    if (storedStoreId) {
      const storedStore = stores.find(s => s.id === storedStoreId);
      if (storedStore) {
        // Validate that the user still has access to this store
        selectStore(storedStoreId);
      } else {
        // Store no longer accessible, clear the stored selection
        clearStoreSelection();
      }
    }
  }, [stores, user, pinData, currentStore]);

  // Listen for PIN session changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pin_session') {
        // PIN session changed, refetch stores
        fetchStores();
      }
    };

    const handlePinSessionChange = () => {
      // Custom event for same-tab PIN session changes
      fetchStores();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pin-session-changed', handlePinSessionChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pin-session-changed', handlePinSessionChange);
    };
  }, []);

  // Also listen for PIN session changes
  useEffect(() => {
    const handleStorageChange = () => {
      fetchStores();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check if user has a valid store selection
  const hasValidStoreSelection = Boolean(currentStore && (pinData || (!pinData && user)));

  const value = {
    stores,
    currentStore,
    userRole,
    loading,
    selectStore,
    updateCurrentStore,
    refreshStores,
    isOwner,
    canManage,
    clearStoreSelection,
    hasValidStoreSelection,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}