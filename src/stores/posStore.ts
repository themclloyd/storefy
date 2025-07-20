import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  stock_quantity: number;
  image_url: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  categories?: { name: string } | null;
  image_url: string | null;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  total_orders: number;
  total_spent: number;
}

// Store State
interface POSState {
  // Cart state
  cart: CartItem[];
  discountType: "percent" | "fixed";
  discountValue: string;
  discountCode: string;
  
  // Product state
  products: Product[];
  categories: Category[];
  loading: boolean;
  searchTerm: string;
  selectedCategory: string | null;
  viewMode: "grid" | "compact" | "list";
  
  // Customer state
  customers: Customer[];
  selectedCustomer: Customer | null;
  customerSearchTerm: string;
  showCustomerSearch: boolean;
  
  // Order state
  paymentMethod: string;
  isProcessingOrder: boolean;
  
  // UI state
  showReceipt: boolean;
  lastOrder: any;
  showOrderHistory: boolean;
  showAddCustomer: boolean;
  showMobileCart: boolean;
  taxCalculation: any;

  // Order history state
  orders: any[];
  ordersLoading: boolean;
  orderSearchTerm: string;
  orderStatusFilter: string;
}

// Store Actions
interface POSActions {
  // Cart actions
  addToCart: (product: Product) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getCartQuantity: (productId: string) => number;
  
  // Discount actions
  setDiscountType: (type: "percent" | "fixed") => void;
  setDiscountValue: (value: string) => void;
  setDiscountCode: (code: string) => void;
  
  // Product actions
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setViewMode: (mode: "grid" | "compact" | "list") => void;
  fetchProducts: (storeId: string) => Promise<void>;
  fetchCategories: (storeId: string) => Promise<void>;
  
  // Customer actions
  setCustomers: (customers: Customer[]) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setCustomerSearchTerm: (term: string) => void;
  setShowCustomerSearch: (show: boolean) => void;
  fetchCustomers: (storeId: string) => Promise<void>;
  addCustomer: (storeId: string, customerData: any) => Promise<Customer | null>;
  
  // Order actions
  setPaymentMethod: (method: string) => void;
  setIsProcessingOrder: (processing: boolean) => void;
  processOrder: (storeId: string, userId: string) => Promise<void>;
  
  // UI actions
  setShowReceipt: (show: boolean) => void;
  setLastOrder: (order: any) => void;
  setShowOrderHistory: (show: boolean) => void;
  setShowAddCustomer: (show: boolean) => void;
  setShowMobileCart: (show: boolean) => void;
  setTaxCalculation: (calculation: any) => void;

  // Order history actions
  setOrders: (orders: any[]) => void;
  setOrdersLoading: (loading: boolean) => void;
  setOrderSearchTerm: (term: string) => void;
  setOrderStatusFilter: (filter: string) => void;
  fetchOrders: (storeId: string) => Promise<void>;
  refundOrder: (orderId: string, orderNumber: string) => Promise<void>;
  
  // Reset actions
  resetPOS: () => void;
}

type POSStore = POSState & POSActions;

const initialState: POSState = {
  // Cart state
  cart: [],
  discountType: "percent",
  discountValue: "",
  discountCode: "",
  
  // Product state
  products: [],
  categories: [],
  loading: true,
  searchTerm: "",
  selectedCategory: null,
  viewMode: "compact",
  
  // Customer state
  customers: [],
  selectedCustomer: null,
  customerSearchTerm: "",
  showCustomerSearch: false,
  
  // Order state
  paymentMethod: "cash",
  isProcessingOrder: false,
  
  // UI state
  showReceipt: false,
  lastOrder: null,
  showOrderHistory: false,
  showAddCustomer: false,
  showMobileCart: false,
  taxCalculation: null,

  // Order history state
  orders: [],
  ordersLoading: false,
  orderSearchTerm: "",
  orderStatusFilter: "all",
};

export const usePOSStore = create<POSStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Cart actions
        addToCart: (product: Product) => {
          const { cart } = get();
          const existingItem = cart.find(item => item.id === product.id);
          const currentCartQuantity = existingItem ? existingItem.quantity : 0;

          if (currentCartQuantity >= product.stock_quantity) {
            toast.error(`Only ${product.stock_quantity} items available in stock`);
            return;
          }

          if (existingItem) {
            set({
              cart: cart.map(item =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            }, false, 'addToCart:existing');
          } else {
            set({
              cart: [...cart, {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                sku: product.sku,
                stock_quantity: product.stock_quantity,
                image_url: product.image_url
              }]
            }, false, 'addToCart:new');
          }
        },

        updateQuantity: (id: string, quantity: number) => {
          const { cart } = get();
          if (quantity <= 0) {
            set({
              cart: cart.filter(item => item.id !== id)
            }, false, 'updateQuantity:remove');
          } else {
            const cartItem = cart.find(item => item.id === id);
            if (cartItem && quantity > cartItem.stock_quantity) {
              toast.error(`Only ${cartItem.stock_quantity} items available in stock`);
              return;
            }

            set({
              cart: cart.map(item =>
                item.id === id ? { ...item, quantity } : item
              )
            }, false, 'updateQuantity:update');
          }
        },

        removeFromCart: (id: string) => {
          const { cart } = get();
          set({
            cart: cart.filter(item => item.id !== id)
          }, false, 'removeFromCart');
        },

        clearCart: () => {
          set({ cart: [] }, false, 'clearCart');
        },

        getCartQuantity: (productId: string) => {
          const { cart } = get();
          const cartItem = cart.find(item => item.id === productId);
          return cartItem ? cartItem.quantity : 0;
        },

        // Discount actions
        setDiscountType: (type) => set({ discountType: type }, false, 'setDiscountType'),
        setDiscountValue: (value) => set({ discountValue: value }, false, 'setDiscountValue'),
        setDiscountCode: (code) => set({ discountCode: code }, false, 'setDiscountCode'),

        // Product actions
        setProducts: (products) => set({ products }, false, 'setProducts'),
        setCategories: (categories) => set({ categories }, false, 'setCategories'),
        setLoading: (loading) => set({ loading }, false, 'setLoading'),
        setSearchTerm: (term) => set({ searchTerm: term }, false, 'setSearchTerm'),
        setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }, false, 'setSelectedCategory'),
        setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),

        fetchProducts: async (storeId: string) => {
          try {
            set({ loading: true }, false, 'fetchProducts:start');
            const { data, error } = await supabase
              .from('products')
              .select(`
                id,
                name,
                sku,
                price,
                stock_quantity,
                category_id,
                image_url,
                is_active,
                categories (name)
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

        fetchCategories: async (storeId: string) => {
          try {
            const { data, error } = await supabase
              .from('categories')
              .select('id, name')
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

        // Customer actions
        setCustomers: (customers) => set({ customers }, false, 'setCustomers'),
        setSelectedCustomer: (customer) => set({ selectedCustomer: customer }, false, 'setSelectedCustomer'),
        setCustomerSearchTerm: (term) => set({ customerSearchTerm: term }, false, 'setCustomerSearchTerm'),
        setShowCustomerSearch: (show) => set({ showCustomerSearch: show }, false, 'setShowCustomerSearch'),

        fetchCustomers: async (storeId: string) => {
          try {
            const { data, error } = await supabase
              .from('customers')
              .select('id, name, email, phone, status, total_orders, total_spent')
              .eq('store_id', storeId)
              .order('name');

            if (error) {
              // Customers are optional, don't show error toast
              return;
            }

            set({ customers: data || [] }, false, 'fetchCustomers');
          } catch (error) {
            // Customers are optional, fail silently
          }
        },

        addCustomer: async (storeId: string, customerData: any) => {
          try {
            const { data, error } = await supabase
              .from('customers')
              .insert({
                store_id: storeId,
                name: customerData.name,
                email: customerData.email || null,
                phone: customerData.phone || null,
                address: customerData.address || null,
                status: customerData.status,
                total_orders: 0,
                total_spent: 0,
              })
              .select()
              .single();

            if (error) {
              toast.error('Failed to add customer');
              return null;
            }

            toast.success('Customer added successfully');

            // Add to local customers list
            const { customers } = get();
            set({
              customers: [...customers, data],
              selectedCustomer: data // Auto-select the new customer
            }, false, 'addCustomer');

            return data;
          } catch (error) {
            toast.error('Failed to add customer');
            return null;
          }
        },

        // Order actions
        setPaymentMethod: (method) => set({ paymentMethod: method }, false, 'setPaymentMethod'),
        setIsProcessingOrder: (processing) => set({ isProcessingOrder: processing }, false, 'setIsProcessingOrder'),

        processOrder: async (storeId: string, userId: string) => {
          // This will be implemented in the next part due to complexity
          // For now, just a placeholder
          set({ isProcessingOrder: true }, false, 'processOrder:start');
          // Implementation will be added in the component refactor
          set({ isProcessingOrder: false }, false, 'processOrder:end');
        },

        // UI actions
        setShowReceipt: (show) => set({ showReceipt: show }, false, 'setShowReceipt'),
        setLastOrder: (order) => set({ lastOrder: order }, false, 'setLastOrder'),
        setShowOrderHistory: (show) => set({ showOrderHistory: show }, false, 'setShowOrderHistory'),
        setShowAddCustomer: (show) => set({ showAddCustomer: show }, false, 'setShowAddCustomer'),
        setShowMobileCart: (show) => set({ showMobileCart: show }, false, 'setShowMobileCart'),
        setTaxCalculation: (calculation) => set({ taxCalculation: calculation }, false, 'setTaxCalculation'),

        // Order history actions
        setOrders: (orders) => set({ orders }, false, 'setOrders'),
        setOrdersLoading: (loading) => set({ ordersLoading: loading }, false, 'setOrdersLoading'),
        setOrderSearchTerm: (term) => set({ orderSearchTerm: term }, false, 'setOrderSearchTerm'),
        setOrderStatusFilter: (filter) => set({ orderStatusFilter: filter }, false, 'setOrderStatusFilter'),

        fetchOrders: async (storeId: string) => {
          set({ ordersLoading: true }, false, 'fetchOrders:start');
          try {
            const { data, error } = await supabase
              .from('orders')
              .select(`
                id,
                order_number,
                total,
                status,
                payment_method,
                created_at,
                customer_id,
                customers (
                  name,
                  email
                )
              `)
              .eq('store_id', storeId)
              .order('created_at', { ascending: false })
              .limit(50);

            if (error) {
              toast.error('Failed to load orders');
              return;
            }

            set({ orders: data || [] }, false, 'fetchOrders:success');
          } catch (error) {
            toast.error('Failed to load orders');
          } finally {
            set({ ordersLoading: false }, false, 'fetchOrders:end');
          }
        },

        refundOrder: async (orderId: string, orderNumber: string) => {
          try {
            const { error } = await supabase
              .from('orders')
              .update({ status: 'refunded' })
              .eq('id', orderId);

            if (error) {
              toast.error('Failed to refund order');
              return;
            }

            toast.success(`Order ${orderNumber} has been refunded`);

            // Refresh orders after refund
            const { fetchOrders } = get();
            const currentStore = get().selectedCustomer; // This should be store context
            // We'll need to pass storeId from component for now
          } catch (error) {
            toast.error('Failed to refund order');
          }
        },

        // Reset actions
        resetPOS: () => set(initialState, false, 'resetPOS'),
      }),
      {
        name: 'pos-store',
        partialize: (state) => ({
          // Only persist cart and UI preferences
          cart: state.cart,
          viewMode: state.viewMode,
          paymentMethod: state.paymentMethod,
        }),
      }
    ),
    { name: 'pos-store' }
  )
);

// Stable selectors for optimized re-renders - only individual properties to avoid infinite loops

// Simple individual selectors - no object returns to avoid infinite loops
export const useCart = () => usePOSStore((state) => state.cart);
export const useProducts = () => usePOSStore((state) => state.products);
export const useCustomers = () => usePOSStore((state) => state.customers);
export const useOrders = () => usePOSStore((state) => state.orders);
export const useOrdersLoading = () => usePOSStore((state) => state.ordersLoading);
