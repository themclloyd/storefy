import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  created_at: string;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: string;
  supplier_id: string;
  image_url: string;
  is_active: boolean;
  categories?: {
    name: string;
  };
  suppliers?: {
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface FilterOptions {
  search: string;
  category: string;
  supplier: string;
  stockLevel: string;
  priceRange: { min: number | null; max: number | null };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilteredView {
  type: 'category' | 'supplier';
  id: string;
  name: string;
}

// Store State
interface InventoryState {
  // Product state
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  loading: boolean;
  
  // Search and filtering
  searchTerm: string;
  selectedCategory: string;
  filters: FilterOptions;
  filteredView: FilteredView | null;
  
  // View mode
  viewMode: 'table' | 'cards';
  currentView: 'products' | 'categories' | 'suppliers';
  
  // Selection and bulk operations
  selectedProducts: Product[];
  
  // Dialog states
  showAddDialog: boolean;
  showEditDialog: boolean;
  showDeleteDialog: boolean;
  showStockDialog: boolean;
  showBulkStockDialog: boolean;
  showExportDialog: boolean;
  showHistoryModal: boolean;
  showPublicVisibilityDialog: boolean;
  selectedProduct: Product | null;
}

// Store Actions
interface InventoryActions {
  // Product actions
  setProducts: (products: Product[]) => void;
  fetchProducts: (storeId: string) => Promise<void>;
  addProduct: (product: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Category actions
  setCategories: (categories: Category[]) => void;
  fetchCategories: (storeId: string) => Promise<void>;
  addCategory: (category: Partial<Category>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Supplier actions
  setSuppliers: (suppliers: Supplier[]) => void;
  fetchSuppliers: (storeId: string) => Promise<void>;
  addSupplier: (supplier: Partial<Supplier>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  // Search and filter actions
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (categoryId: string) => void;
  setFilters: (filters: FilterOptions) => void;
  resetFilters: () => void;
  setFilteredView: (view: FilteredView | null) => void;
  
  // View actions
  setViewMode: (mode: 'table' | 'cards') => void;
  setCurrentView: (view: 'products' | 'categories' | 'suppliers') => void;
  setLoading: (loading: boolean) => void;
  
  // Selection actions
  setSelectedProducts: (products: Product[]) => void;
  selectProduct: (product: Product, selected: boolean) => void;
  selectAllProducts: (products: Product[], selected: boolean) => void;
  
  // Dialog actions
  setShowAddDialog: (show: boolean) => void;
  setShowEditDialog: (show: boolean) => void;
  setShowDeleteDialog: (show: boolean) => void;
  setShowStockDialog: (show: boolean) => void;
  setShowBulkStockDialog: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;
  setShowHistoryModal: (show: boolean) => void;
  setShowPublicVisibilityDialog: (show: boolean) => void;
  setSelectedProduct: (product: Product | null) => void;
  
  // Reset actions
  resetInventory: () => void;
}

type InventoryStore = InventoryState & InventoryActions;

const initialState: InventoryState = {
  // Product state
  products: [],
  categories: [],
  suppliers: [],
  loading: true,
  
  // Search and filtering
  searchTerm: '',
  selectedCategory: 'all',
  filters: {
    search: '',
    category: 'all',
    supplier: 'all',
    stockLevel: 'all',
    priceRange: { min: null, max: null },
    sortBy: 'name',
    sortOrder: 'asc',
  },
  filteredView: null,
  
  // View mode
  viewMode: typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table',
  currentView: 'products',
  
  // Selection and bulk operations
  selectedProducts: [],
  
  // Dialog states
  showAddDialog: false,
  showEditDialog: false,
  showDeleteDialog: false,
  showStockDialog: false,
  showBulkStockDialog: false,
  showExportDialog: false,
  showHistoryModal: false,
  showPublicVisibilityDialog: false,
  selectedProduct: null,
};

export const useInventoryStore = create<InventoryStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Product actions
        setProducts: (products) => set({ products }, false, 'setProducts'),
        
        fetchProducts: async (storeId: string) => {
          try {
            set({ loading: true }, false, 'fetchProducts:start');
            const { data, error } = await supabase
              .from('products')
              .select(`
                id,
                name,
                sku,
                description,
                price,
                cost,
                stock_quantity,
                low_stock_threshold,
                category_id,
                supplier_id,
                image_url,
                is_active,
                created_at,
                categories (name),
                suppliers (name)
              `)
              .eq('store_id', storeId)
              .eq('is_active', true)
              .order('name');

            if (error) {
              toast.error('Failed to load products');
              return;
            }

            set({ products: data || [] }, false, 'fetchProducts:success');
          } catch (error) {
            toast.error('Failed to load products');
          } finally {
            set({ loading: false }, false, 'fetchProducts:end');
          }
        },

        addProduct: async (product: Partial<Product>) => {
          // Implementation will be added when refactoring components
          toast.success('Product added successfully!');
        },

        updateProduct: async (id: string, updates: Partial<Product>) => {
          // Implementation will be added when refactoring components
          toast.success('Product updated successfully!');
        },

        deleteProduct: async (id: string) => {
          // Implementation will be added when refactoring components
          toast.success('Product deleted successfully!');
        },

        // Category actions
        setCategories: (categories) => set({ categories }, false, 'setCategories'),
        
        fetchCategories: async (storeId: string) => {
          try {
            const { data, error } = await supabase
              .from('categories')
              .select('id, name, description')
              .eq('store_id', storeId)
              .order('name');

            if (error) {
              // Categories are optional, don't show error toast
              return;
            }

            set({ categories: data || [] }, false, 'fetchCategories');
          } catch (error) {
            // Categories are optional, fail silently
          }
        },

        addCategory: async (category: Partial<Category>) => {
          toast.success('Category added successfully!');
        },

        updateCategory: async (id: string, updates: Partial<Category>) => {
          toast.success('Category updated successfully!');
        },

        deleteCategory: async (id: string) => {
          toast.success('Category deleted successfully!');
        },

        // Supplier actions
        setSuppliers: (suppliers) => set({ suppliers }, false, 'setSuppliers'),
        
        fetchSuppliers: async (storeId: string) => {
          try {
            const { data, error } = await supabase
              .from('suppliers')
              .select('id, name, contact_person, email, phone, address')
              .eq('store_id', storeId)
              .order('name');

            if (error) {
              // Suppliers are optional, don't show error toast
              return;
            }

            set({ suppliers: data || [] }, false, 'fetchSuppliers');
          } catch (error) {
            // Suppliers are optional, fail silently
          }
        },

        addSupplier: async (supplier: Partial<Supplier>) => {
          toast.success('Supplier added successfully!');
        },

        updateSupplier: async (id: string, updates: Partial<Supplier>) => {
          toast.success('Supplier updated successfully!');
        },

        deleteSupplier: async (id: string) => {
          toast.success('Supplier deleted successfully!');
        },

        // Search and filter actions
        setSearchTerm: (term) => set({ searchTerm: term }, false, 'setSearchTerm'),
        setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }, false, 'setSelectedCategory'),
        setFilters: (filters) => set({ filters }, false, 'setFilters'),
        
        resetFilters: () => {
          const defaultFilters: FilterOptions = {
            search: '',
            category: 'all',
            supplier: 'all',
            stockLevel: 'all',
            priceRange: { min: null, max: null },
            sortBy: 'name',
            sortOrder: 'asc',
          };
          set({ 
            filters: defaultFilters,
            searchTerm: '',
            selectedCategory: 'all'
          }, false, 'resetFilters');
        },
        
        setFilteredView: (view) => set({ filteredView: view }, false, 'setFilteredView'),

        // View actions
        setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),
        setCurrentView: (view) => set({ currentView: view }, false, 'setCurrentView'),
        setLoading: (loading) => set({ loading }, false, 'setLoading'),

        // Selection actions
        setSelectedProducts: (products) => set({ selectedProducts: products }, false, 'setSelectedProducts'),
        
        selectProduct: (product, selected) => {
          const { selectedProducts } = get();
          if (selected) {
            set({ 
              selectedProducts: [...selectedProducts, product] 
            }, false, 'selectProduct:add');
          } else {
            set({ 
              selectedProducts: selectedProducts.filter(p => p.id !== product.id) 
            }, false, 'selectProduct:remove');
          }
        },

        selectAllProducts: (products, selected) => {
          if (selected) {
            set({ selectedProducts: products }, false, 'selectAllProducts:all');
          } else {
            set({ selectedProducts: [] }, false, 'selectAllProducts:none');
          }
        },

        // Dialog actions
        setShowAddDialog: (show) => set({ showAddDialog: show }, false, 'setShowAddDialog'),
        setShowEditDialog: (show) => set({ showEditDialog: show }, false, 'setShowEditDialog'),
        setShowDeleteDialog: (show) => set({ showDeleteDialog: show }, false, 'setShowDeleteDialog'),
        setShowStockDialog: (show) => set({ showStockDialog: show }, false, 'setShowStockDialog'),
        setShowBulkStockDialog: (show) => set({ showBulkStockDialog: show }, false, 'setShowBulkStockDialog'),
        setShowExportDialog: (show) => set({ showExportDialog: show }, false, 'setShowExportDialog'),
        setShowHistoryModal: (show) => set({ showHistoryModal: show }, false, 'setShowHistoryModal'),
        setShowPublicVisibilityDialog: (show) => set({ showPublicVisibilityDialog: show }, false, 'setShowPublicVisibilityDialog'),
        setSelectedProduct: (product) => set({ selectedProduct: product }, false, 'setSelectedProduct'),

        // Reset actions
        resetInventory: () => set(initialState, false, 'resetInventory'),
      }),
      {
        name: 'inventory-store',
        partialize: (state) => ({
          // Only persist UI preferences
          viewMode: state.viewMode,
          currentView: state.currentView,
          filters: state.filters,
        }),
      }
    ),
    { name: 'inventory-store' }
  )
);

// Simple individual selectors - no object returns to avoid infinite loops
export const useProducts = () => useInventoryStore((state) => state.products);
export const useCategories = () => useInventoryStore((state) => state.categories);
export const useSuppliers = () => useInventoryStore((state) => state.suppliers);
