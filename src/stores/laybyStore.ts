import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface LaybyOrder {
  id: string;
  layby_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  total_amount: number;
  deposit_amount: number;
  balance_remaining: number;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  created_by: string;
  layby_items?: LaybyItem[];
}

export interface LaybyItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string;
  products?: {
    id: string;
    name: string;
    sku: string;
    is_active: boolean;
  };
}

export interface LaybyPayment {
  id: string;
  layby_order_id: string;
  payment_amount: number;
  payment_method: string;
  payment_reference: string;
  notes: string | null;
  processed_by: string;
  created_at: string;
}

export interface LaybyStats {
  total: number;
  active: number;
  overdue: number;
  completed: number;
  totalValue: number;
  outstandingBalance: number;
  depositsCollected: number;
}

export interface LaybyFilters {
  searchTerm: string;
  statusFilter: string;
}

export interface LaybySettings {
  id?: string;
  store_id: string;
  require_deposit_percent: number;
  max_layby_duration_days: number;
  automatic_reminders_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// Store State
interface LaybyState {
  // Core data
  laybyOrders: LaybyOrder[];
  loading: boolean;
  
  // Filtering and search
  filters: LaybyFilters;
  filteredOrders: LaybyOrder[];
  
  // Statistics
  stats: LaybyStats;
  
  // Selected layby and details
  selectedLayby: LaybyOrder | null;
  
  // Dialog states
  showAddDialog: boolean;
  showDetailsModal: boolean;
  showPaymentDialog: boolean;
  showSettingsDialog: boolean;
  
  // Layby payments
  laybyPayments: LaybyPayment[];
  paymentsLoading: boolean;
  
  // Layby settings
  laybySettings: LaybySettings | null;
  settingsLoading: boolean;
}

// Store Actions
interface LaybyActions {
  // Layby data actions
  setLaybyOrders: (orders: LaybyOrder[]) => void;
  fetchLaybyOrders: (storeId: string) => Promise<void>;
  addLaybyOrder: (storeId: string, orderData: any) => Promise<void>;
  
  // Filtering actions
  setFilters: (filters: Partial<LaybyFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  
  // Statistics actions
  calculateStats: () => void;
  
  // Selection and UI actions
  setSelectedLayby: (layby: LaybyOrder | null) => void;
  setShowAddDialog: (show: boolean) => void;
  setShowDetailsModal: (show: boolean) => void;
  setShowPaymentDialog: (show: boolean) => void;
  setShowSettingsDialog: (show: boolean) => void;
  
  // Payment actions
  fetchLaybyPayments: (laybyOrderId: string) => Promise<void>;
  processPayment: (laybyOrderId: string, paymentData: any) => Promise<void>;
  setLaybyPayments: (payments: LaybyPayment[]) => void;
  setPaymentsLoading: (loading: boolean) => void;
  
  // Settings actions
  fetchLaybySettings: (storeId: string) => Promise<void>;
  updateLaybySettings: (storeId: string, settings: Partial<LaybySettings>) => Promise<void>;
  setLaybySettings: (settings: LaybySettings | null) => void;
  setSettingsLoading: (loading: boolean) => void;
  
  // Reset actions
  resetLayby: () => void;
}

type LaybyStore = LaybyState & LaybyActions;

const initialFilters: LaybyFilters = {
  searchTerm: '',
  statusFilter: 'all',
};

const initialStats: LaybyStats = {
  total: 0,
  active: 0,
  overdue: 0,
  completed: 0,
  totalValue: 0,
  outstandingBalance: 0,
  depositsCollected: 0,
};

const initialState: LaybyState = {
  // Core data
  laybyOrders: [],
  loading: true,
  
  // Filtering and search
  filters: initialFilters,
  filteredOrders: [],
  
  // Statistics
  stats: initialStats,
  
  // Selected layby and details
  selectedLayby: null,
  
  // Dialog states
  showAddDialog: false,
  showDetailsModal: false,
  showPaymentDialog: false,
  showSettingsDialog: false,
  
  // Layby payments
  laybyPayments: [],
  paymentsLoading: false,
  
  // Layby settings
  laybySettings: null,
  settingsLoading: false,
};

export const useLaybyStore = create<LaybyStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Layby data actions
        setLaybyOrders: (orders) => {
          set({ laybyOrders: orders }, false, 'setLaybyOrders');
          // Auto-apply filters and calculate stats when orders change
          setTimeout(() => {
            get().applyFilters();
            get().calculateStats();
          }, 0);
        },
        
        fetchLaybyOrders: async (storeId: string) => {
          try {
            set({ loading: true }, false, 'fetchLaybyOrders:start');
            
            // Fetch layby orders with items
            const { data, error } = await supabase
              .from('layby_orders')
              .select(`
                *,
                layby_items (
                  id,
                  quantity,
                  unit_price,
                  total_price,
                  product_id,
                  products (id, name, sku, is_active)
                )
              `)
              .eq('store_id', storeId)
              .order('created_at', { ascending: false });

            if (error) {
              console.error('Error fetching layby orders:', error);
              toast.error('Failed to load layby orders');
              set({ loading: false }, false, 'fetchLaybyOrders:error');
              return;
            }

            set({ 
              laybyOrders: data || [],
              loading: false 
            }, false, 'fetchLaybyOrders:success');
            
            // Apply filters and calculate stats after setting orders
            get().applyFilters();
            get().calculateStats();
          } catch (error) {
            console.error('Error fetching layby orders:', error);
            toast.error('Failed to load layby orders');
            set({ loading: false }, false, 'fetchLaybyOrders:error');
          }
        },
        
        addLaybyOrder: async (storeId: string, orderData: any) => {
          try {
            // Generate layby number
            const { data: laybyNumberData, error: laybyNumberError } = await supabase
              .rpc('generate_layby_number', { store_id: storeId });

            if (laybyNumberError) {
              toast.error('Failed to generate layby number');
              return;
            }

            // Create layby order
            const { error: laybyError } = await supabase
              .from('layby_orders')
              .insert({
                store_id: storeId,
                layby_number: laybyNumberData,
                customer_name: orderData.customer_name,
                customer_phone: orderData.customer_phone || null,
                total_amount: orderData.total_amount,
                deposit_amount: orderData.deposit_amount,
                balance_remaining: orderData.total_amount - orderData.deposit_amount,
                status: 'active',
                notes: orderData.notes || null,
                created_by: orderData.created_by,
              });

            if (laybyError) {
              toast.error('Failed to create layby order');
              return;
            }

            toast.success('Layby order created successfully');
            
            // Refresh layby orders
            get().fetchLaybyOrders(storeId);
          } catch (error) {
            console.error('Error creating layby order:', error);
            toast.error('Failed to create layby order');
          }
        },

        // Filtering actions
        setFilters: (newFilters) => {
          const { filters } = get();
          const updatedFilters = { ...filters, ...newFilters };
          set({ filters: updatedFilters }, false, 'setFilters');
          get().applyFilters();
        },

        resetFilters: () => {
          set({ filters: initialFilters }, false, 'resetFilters');
          get().applyFilters();
        },

        applyFilters: () => {
          const { laybyOrders, filters } = get();
          let filtered = [...laybyOrders];

          // Text search
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(order =>
              order.customer_name.toLowerCase().includes(searchLower) ||
              order.layby_number.toLowerCase().includes(searchLower) ||
              (order.customer_phone && order.customer_phone.includes(filters.searchTerm))
            );
          }

          // Status filter
          if (filters.statusFilter !== "all") {
            filtered = filtered.filter(order => order.status === filters.statusFilter);
          }

          set({ filteredOrders: filtered }, false, 'applyFilters');
        },

        // Statistics actions
        calculateStats: () => {
          const { laybyOrders } = get();

          const newStats: LaybyStats = {
            total: laybyOrders.length,
            active: laybyOrders.filter(o => o.status === 'active').length,
            overdue: laybyOrders.filter(o => o.status === 'overdue').length,
            completed: laybyOrders.filter(o => o.status === 'completed').length,
            totalValue: laybyOrders.reduce((sum, o) => sum + o.total_amount, 0),
            outstandingBalance: laybyOrders
              .filter(o => o.status === 'active' || o.status === 'overdue')
              .reduce((sum, o) => sum + o.balance_remaining, 0),
            depositsCollected: laybyOrders.reduce((sum, o) => sum + o.deposit_amount, 0)
          };

          set({ stats: newStats }, false, 'calculateStats');
        },

        // Selection and UI actions
        setSelectedLayby: (layby) => set({ selectedLayby: layby }, false, 'setSelectedLayby'),
        setShowAddDialog: (show) => set({ showAddDialog: show }, false, 'setShowAddDialog'),
        setShowDetailsModal: (show) => set({ showDetailsModal: show }, false, 'setShowDetailsModal'),
        setShowPaymentDialog: (show) => set({ showPaymentDialog: show }, false, 'setShowPaymentDialog'),
        setShowSettingsDialog: (show) => set({ showSettingsDialog: show }, false, 'setShowSettingsDialog'),

        // Payment actions
        fetchLaybyPayments: async (laybyOrderId: string) => {
          try {
            set({ paymentsLoading: true }, false, 'fetchLaybyPayments:start');
            const { data, error } = await supabase
              .from('layby_payments')
              .select('*')
              .eq('layby_order_id', laybyOrderId)
              .order('created_at', { ascending: false });

            if (error) {
              console.error('Error fetching layby payments:', error);
              toast.error('Failed to load payment history');
              return;
            }

            set({
              laybyPayments: data || [],
              paymentsLoading: false
            }, false, 'fetchLaybyPayments:success');
          } catch (error) {
            console.error('Error fetching layby payments:', error);
            toast.error('Failed to load payment history');
            set({ paymentsLoading: false }, false, 'fetchLaybyPayments:error');
          }
        },

        processPayment: async (laybyOrderId: string, paymentData: any) => {
          try {
            // Process the payment using the database function
            const { error: paymentError } = await supabase
              .rpc('process_layby_payment', {
                _layby_order_id: laybyOrderId,
                _payment_amount: paymentData.payment_amount,
                _payment_method: paymentData.payment_method,
                _payment_reference: paymentData.payment_reference,
                _notes: paymentData.notes || null,
                _processed_by: paymentData.processed_by,
              });

            if (paymentError) {
              console.error('Error processing payment:', paymentError);
              toast.error('Failed to process payment');
              return;
            }

            toast.success('Payment processed successfully');

            // Refresh payment history
            get().fetchLaybyPayments(laybyOrderId);
          } catch (error) {
            console.error('Error processing payment:', error);
            toast.error('Failed to process payment');
          }
        },

        setLaybyPayments: (payments) => set({ laybyPayments: payments }, false, 'setLaybyPayments'),
        setPaymentsLoading: (loading) => set({ paymentsLoading: loading }, false, 'setPaymentsLoading'),

        // Settings actions
        fetchLaybySettings: async (storeId: string) => {
          try {
            set({ settingsLoading: true }, false, 'fetchLaybySettings:start');
            const { data, error } = await supabase
              .from('layby_settings')
              .select('*')
              .eq('store_id', storeId)
              .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
              console.error('Error fetching layby settings:', error);
              toast.error('Failed to load layby settings');
              return;
            }

            set({
              laybySettings: data || null,
              settingsLoading: false
            }, false, 'fetchLaybySettings:success');
          } catch (error) {
            console.error('Error fetching layby settings:', error);
            toast.error('Failed to load layby settings');
            set({ settingsLoading: false }, false, 'fetchLaybySettings:error');
          }
        },

        updateLaybySettings: async (storeId: string, settings: Partial<LaybySettings>) => {
          try {
            const { laybySettings } = get();

            if (laybySettings?.id) {
              // Update existing settings
              const { error } = await supabase
                .from('layby_settings')
                .update(settings)
                .eq('id', laybySettings.id);

              if (error) {
                toast.error('Failed to update layby settings');
                return;
              }
            } else {
              // Create new settings
              const { error } = await supabase
                .from('layby_settings')
                .insert({
                  store_id: storeId,
                  ...settings,
                });

              if (error) {
                toast.error('Failed to create layby settings');
                return;
              }
            }

            toast.success('Layby settings updated successfully');

            // Refresh settings
            get().fetchLaybySettings(storeId);
          } catch (error) {
            console.error('Error updating layby settings:', error);
            toast.error('Failed to update layby settings');
          }
        },

        setLaybySettings: (settings) => set({ laybySettings: settings }, false, 'setLaybySettings'),
        setSettingsLoading: (loading) => set({ settingsLoading: loading }, false, 'setSettingsLoading'),

        // Reset actions
        resetLayby: () => set(initialState, false, 'resetLayby'),
      }),
      {
        name: 'layby-store',
        partialize: (state) => ({
          // Only persist UI preferences
          filters: state.filters,
        }),
      }
    ),
    { name: 'layby-store' }
  )
);

// Simple individual selectors - no object returns to avoid infinite loops
export const useLaybyOrders = () => useLaybyStore((state) => state.laybyOrders);
export const useFilteredLaybyOrders = () => useLaybyStore((state) => state.filteredOrders);
export const useLaybyStats = () => useLaybyStore((state) => state.stats);
export const useLaybyPayments = () => useLaybyStore((state) => state.laybyPayments);
export const useLaybySettings = () => useLaybyStore((state) => state.laybySettings);

// Action selectors
export const useFetchLaybyOrders = () => useLaybyStore((state) => state.fetchLaybyOrders);
