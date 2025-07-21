import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackShowcaseView, trackProductClick, trackContactClick } from '@/lib/analytics-tracker';

export interface PublicStore {
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
}

export interface PublicProduct {
  product_id: string;
  product_name: string;
  product_description?: string;
  public_description?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  category_name?: string;
  category_id?: string;
  show_stock_publicly: boolean;
  show_price_publicly: boolean;
  created_at: string;
}

export interface PublicCategory {
  category_id: string;
  category_name: string;
  product_count: number;
}

interface PublicShowcaseState {
  // Store data
  store: PublicStore | null;
  products: PublicProduct[];
  categories: PublicCategory[];
  
  // Loading states
  storeLoading: boolean;
  productsLoading: boolean;
  categoriesLoading: boolean;
  
  // Filters and search
  searchQuery: string;
  selectedCategory: string;
  viewMode: 'grid' | 'list';
  
  // Selected product for modal
  selectedProduct: PublicProduct | null;
  showProductModal: boolean;
  
  // Actions
  loadStore: (identifier: string) => Promise<void>;
  loadProducts: (identifier: string) => Promise<void>;
  loadCategories: (identifier: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  selectProduct: (product: PublicProduct) => void;
  closeProductModal: () => void;
  trackView: (identifier: string, referrer: string) => void;
  trackProductClick: (productId: string, productName: string) => void;
  trackContactClick: (contactType: string) => void;
  updatePageMeta: () => void;
  reset: () => void;
}

const initialState = {
  store: null,
  products: [],
  categories: [],
  storeLoading: false,
  productsLoading: false,
  categoriesLoading: false,
  searchQuery: '',
  selectedCategory: 'all',
  viewMode: 'grid' as const,
  selectedProduct: null,
  showProductModal: false,
};

export const usePublicShowcaseStore = create<PublicShowcaseState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadStore: async (identifier: string) => {
        try {
          set({ storeLoading: true }, false, 'loadStore:start');

          const { data, error } = await supabase
            .rpc('get_public_store_info', { store_identifier: identifier });

          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error('Store not found or not public');
          }

          const storeData = data[0];
          const store: PublicStore = {
            id: storeData.store_id,
            name: storeData.store_name,
            address: storeData.store_address,
            phone: storeData.store_phone,
            email: storeData.store_email,
            store_code: storeData.store_code,
            currency: storeData.store_currency || 'USD',
            showcase_slug: storeData.showcase_slug,
            showcase_theme: storeData.showcase_theme,
            showcase_description: storeData.showcase_description,
            showcase_logo_url: storeData.showcase_logo_url,
            showcase_banner_url: storeData.showcase_banner_url,
            showcase_contact_info: storeData.showcase_contact_info,
            showcase_seo_title: storeData.showcase_seo_title,
            showcase_seo_description: storeData.showcase_seo_description,
            product_count: storeData.product_count,
            category_count: storeData.category_count
          };

          set({ store, storeLoading: false }, false, 'loadStore:success');

          // Set view mode from theme
          if (storeData.showcase_theme?.layout) {
            const viewMode = storeData.showcase_theme.layout === 'list' ? 'list' : 'grid';
            set({ viewMode }, false, 'loadStore:setViewMode');
          }

          // Update page meta
          get().updatePageMeta();

        } catch (error) {
          console.error('Error loading store:', error);
          toast.error('Failed to load store information');
          set({ storeLoading: false }, false, 'loadStore:error');
          throw error;
        }
      },

      loadProducts: async (identifier: string) => {
        try {
          set({ productsLoading: true }, false, 'loadProducts:start');
          
          const { searchQuery, selectedCategory } = get();
          const categoryFilter = selectedCategory === 'all' ? null : selectedCategory;
          const searchFilter = searchQuery.trim() || null;

          const { data, error } = await supabase
            .rpc('get_public_products', {
              store_identifier: identifier,
              category_filter: categoryFilter,
              search_query: searchFilter
            });

          if (error) throw error;

          set({ 
            products: data || [], 
            productsLoading: false 
          }, false, 'loadProducts:success');

        } catch (error) {
          console.error('Error loading products:', error);
          toast.error('Failed to load products');
          set({ productsLoading: false }, false, 'loadProducts:error');
        }
      },

      loadCategories: async (identifier: string) => {
        try {
          set({ categoriesLoading: true }, false, 'loadCategories:start');

          const { data, error } = await supabase
            .rpc('get_public_categories', { store_identifier: identifier });

          if (error) throw error;

          set({ 
            categories: data || [], 
            categoriesLoading: false 
          }, false, 'loadCategories:success');

        } catch (error) {
          console.error('Error loading categories:', error);
          set({ categoriesLoading: false }, false, 'loadCategories:error');
        }
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query }, false, 'setSearchQuery');
      },

      setSelectedCategory: (category: string) => {
        set({ selectedCategory: category }, false, 'setSelectedCategory');
      },

      setViewMode: (mode: 'grid' | 'list') => {
        set({ viewMode: mode }, false, 'setViewMode');
      },

      selectProduct: (product: PublicProduct) => {
        set({ 
          selectedProduct: product, 
          showProductModal: true 
        }, false, 'selectProduct');
        
        // Track product click
        get().trackProductClick(product.product_id, product.product_name);
      },

      closeProductModal: () => {
        set({ 
          selectedProduct: null, 
          showProductModal: false 
        }, false, 'closeProductModal');
      },

      trackView: (identifier: string, referrer: string) => {
        trackShowcaseView(identifier, referrer);
      },

      trackProductClick: (productId: string, productName: string) => {
        trackProductClick(productId, productName);
      },

      trackContactClick: (contactType: string) => {
        trackContactClick(contactType);
      },

      updatePageMeta: () => {
        const { store } = get();
        if (!store) return;

        // Update page title
        document.title = store.showcase_seo_title || `${store.name} - Product Catalog`;

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', 
            store.showcase_seo_description || 
            store.showcase_description || 
            `Browse products from ${store.name}`
          );
        }
      },

      reset: () => {
        set(initialState, false, 'reset');
      },
    }),
    {
      name: 'public-showcase-store',
    }
  )
);

// Selectors for optimized re-renders
export const usePublicStore = () => usePublicShowcaseStore((state) => state.store);
export const usePublicProducts = () => usePublicShowcaseStore((state) => state.products);
export const usePublicCategories = () => usePublicShowcaseStore((state) => state.categories);
export const usePublicShowcaseLoading = () => usePublicShowcaseStore((state) => ({
  storeLoading: state.storeLoading,
  productsLoading: state.productsLoading,
  categoriesLoading: state.categoriesLoading,
}));
export const usePublicShowcaseFilters = () => usePublicShowcaseStore((state) => ({
  searchQuery: state.searchQuery,
  selectedCategory: state.selectedCategory,
  viewMode: state.viewMode,
}));
export const usePublicProductModal = () => usePublicShowcaseStore((state) => ({
  selectedProduct: state.selectedProduct,
  showProductModal: state.showProductModal,
}));
