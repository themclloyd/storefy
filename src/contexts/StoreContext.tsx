import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = currentStore?.owner_id === user?.id;
  const canManage = isOwner || userRole === 'manager';

  const fetchStores = async () => {
    if (!user) {
      setStores([]);
      setCurrentStore(null);
      setLoading(false);
      return;
    }

    try {
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

      const allStores: Store[] = [
        ...(ownedStores || []).map(store => ({ ...store, role: 'owner' })),
        ...(memberStores || []).map(member => ({ 
          ...member.stores, 
          role: member.role 
        }))
      ];

      setStores(allStores);

      // Auto-select first store if none selected
      if (allStores.length > 0 && !currentStore) {
        const firstStore = allStores[0];
        setCurrentStore(firstStore);
        setUserRole(firstStore.role || null);
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
    fetchStores();
  }, [user]);

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