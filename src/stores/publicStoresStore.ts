import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PublicStoreCard {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  store_code?: string;
  currency?: string;
  showcase_slug?: string;
  showcase_theme?: any;
  showcase_description?: string;
  showcase_logo_url?: string;
  showcase_banner_url?: string;
  showcase_contact_info?: any;
  showcase_seo_title?: string;
  showcase_seo_description?: string;
  product_count: number;
  category_count: number;
  created_at: string;
}

interface PublicStoresState {
  // Store data
  stores: PublicStoreCard[];
  
  // Loading states
  storesLoading: boolean;
  
  // Filters and search
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'name' | 'products';
  
  // Actions
  loadStores: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'newest' | 'oldest' | 'name' | 'products') => void;
  reset: () => void;
}

const initialState = {
  stores: [],
  storesLoading: false,
  searchQuery: '',
  sortBy: 'newest' as const,
};

export const usePublicStoresStore = create<PublicStoresState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadStores: async () => {
        try {
          set({ storesLoading: true }, false, 'loadStores:start');

          const { data, error } = await supabase
            .rpc('get_all_public_stores');

          if (error) throw error;

          set({ 
            stores: data || [], 
            storesLoading: false 
          }, false, 'loadStores:success');

        } catch (error) {
          console.error('Error loading public stores:', error);
          toast.error('Failed to load stores');
          set({ storesLoading: false }, false, 'loadStores:error');
        }
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query }, false, 'setSearchQuery');
      },

      setSortBy: (sort: 'newest' | 'oldest' | 'name' | 'products') => {
        set({ sortBy: sort }, false, 'setSortBy');
      },

      reset: () => {
        set(initialState, false, 'reset');
      },
    }),
    {
      name: 'public-stores-store',
    }
  )
);

// Selectors for optimized re-renders
export const usePublicStores = () => usePublicStoresStore((state) => state.stores);
export const usePublicStoresLoading = () => usePublicStoresStore((state) => state.storesLoading);
export const usePublicStoresFilters = () => usePublicStoresStore((state) => ({
  searchQuery: state.searchQuery,
  sortBy: state.sortBy,
}));
