import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShowcaseTheme, ShowcaseContactInfo } from './publicShowcaseStore';

export interface PublicStoreCard {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  store_code: string;
  currency?: string | null;
  showcase_slug?: string | null;
  showcase_theme?: ShowcaseTheme | null;
  showcase_description?: string | null;
  showcase_logo_url?: string | null;
  showcase_banner_url?: string | null;
  showcase_contact_info?: ShowcaseContactInfo | null;
  showcase_seo_title?: string | null;
  showcase_seo_description?: string | null;
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
    (set) => ({
      ...initialState,

      loadStores: async () => {
        try {
          set({ storesLoading: true }, false, 'loadStores:start');

          // Use direct table query instead of RPC
          const { data, error } = await supabase
            .from('stores')
            .select(`
              id,
              name,
              address,
              phone,
              email,
              store_code,
              currency,
              showcase_slug,
              showcase_theme,
              showcase_description,
              showcase_logo_url,
              showcase_banner_url,
              showcase_contact_info,
              showcase_seo_title,
              showcase_seo_description,
              product_count: products(count),
              category_count: categories(count),
              created_at
            `)
            .eq('is_public', true)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Transform the data to match the PublicStoreCard interface
          const stores = (data || []).map(store => {
            // Safely parse JSON fields
            let showcaseTheme: ShowcaseTheme | null = null;
            let contactInfo: ShowcaseContactInfo | null = null;
            
            try {
              showcaseTheme = typeof store.showcase_theme === 'string' 
                ? JSON.parse(store.showcase_theme) 
                : store.showcase_theme;
                
              contactInfo = typeof store.showcase_contact_info === 'string'
                ? JSON.parse(store.showcase_contact_info)
                : store.showcase_contact_info;
            } catch (e) {
              console.warn('Error parsing store JSON data:', e);
            }
            
            return {
              ...store,
              showcase_theme: showcaseTheme || undefined,
              showcase_contact_info: contactInfo || undefined,
              product_count: Array.isArray(store.product_count) ? store.product_count[0]?.count || 0 : 0,
              category_count: Array.isArray(store.category_count) ? store.category_count[0]?.count || 0 : 0
            };
          });

          set({ 
            stores,
            storesLoading: false 
          }, false, 'loadStores:success');

        } catch (error) {
          console.error('Error loading public stores:', error);
          toast.error('Failed to load stores');
          set({ storesLoading: false, stores: [] }, false, 'loadStores:error');
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
