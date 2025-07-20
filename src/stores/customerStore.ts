import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  total_orders: number | null;
  total_spent: number | null;
  status: string | null;
  created_at: string;
  last_order_date?: string | null;
  notes?: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
  items_count?: number;
}

export interface FilterOptions {
  searchTerm: string;
  status: string;
  minSpent: string;
  maxSpent: string;
  minOrders: string;
  maxOrders: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

// Store State
interface CustomerState {
  // Core data
  customers: Customer[];
  loading: boolean;
  
  // Search and filtering
  searchTerm: string;
  filters: FilterOptions;
  filteredCustomers: Customer[];
  
  // View mode
  viewMode: 'table' | 'cards';
  
  // Selection
  selectedCustomer: Customer | null;
  
  // Dialog states
  showAddDialog: boolean;
  showEditDialog: boolean;
  showDetailsModal: boolean;
  showExportDialog: boolean;
  showStatusDialog: boolean;
  showAnalytics: boolean;
  
  // Customer details
  customerOrders: Order[];
  ordersLoading: boolean;
}

// Store Actions
interface CustomerActions {
  // Customer data actions
  setCustomers: (customers: Customer[]) => void;
  fetchCustomers: (storeId: string) => Promise<void>;
  addCustomer: (storeId: string, customerData: any) => Promise<Customer | null>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Search and filter actions
  setSearchTerm: (term: string) => void;
  setFilters: (filters: FilterOptions) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  
  // View actions
  setViewMode: (mode: 'table' | 'cards') => void;
  setLoading: (loading: boolean) => void;
  
  // Selection actions
  setSelectedCustomer: (customer: Customer | null) => void;
  
  // Dialog actions
  setShowAddDialog: (show: boolean) => void;
  setShowEditDialog: (show: boolean) => void;
  setShowDetailsModal: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;
  setShowStatusDialog: (show: boolean) => void;
  setShowAnalytics: (show: boolean) => void;
  
  // Customer details actions
  setCustomerOrders: (orders: Order[]) => void;
  fetchCustomerOrders: (customerId: string) => Promise<void>;
  setOrdersLoading: (loading: boolean) => void;
  
  // Reset actions
  resetCustomers: () => void;
}

type CustomerStore = CustomerState & CustomerActions;

const initialFilters: FilterOptions = {
  searchTerm: '',
  status: 'all',
  minSpent: '',
  maxSpent: '',
  minOrders: '',
  maxOrders: '',
  dateFrom: undefined,
  dateTo: undefined,
};

const initialState: CustomerState = {
  // Core data
  customers: [],
  loading: true,
  
  // Search and filtering
  searchTerm: '',
  filters: initialFilters,
  filteredCustomers: [],
  
  // View mode
  viewMode: typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table',
  
  // Selection
  selectedCustomer: null,
  
  // Dialog states
  showAddDialog: false,
  showEditDialog: false,
  showDetailsModal: false,
  showExportDialog: false,
  showStatusDialog: false,
  showAnalytics: false,
  
  // Customer details
  customerOrders: [],
  ordersLoading: false,
};

export const useCustomerStore = create<CustomerStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Customer data actions
        setCustomers: (customers) => {
          set({ customers }, false, 'setCustomers');
          // Auto-apply filters when customers change
          get().applyFilters();
        },
        
        fetchCustomers: async (storeId: string) => {
          try {
            set({ loading: true }, false, 'fetchCustomers:start');
            const { data, error } = await supabase
              .from('customers')
              .select(`
                id,
                name,
                email,
                phone,
                address,
                total_orders,
                total_spent,
                status,
                created_at,
                notes
              `)
              .eq('store_id', storeId)
              .order('name');

            if (error) {
              console.error('Error fetching customers:', error);
              toast.error('Failed to load customers');
              return;
            }

            // For each customer, get their last order date
            const customersWithLastOrder = await Promise.all(
              (data || []).map(async (customer) => {
                const { data: lastOrder } = await supabase
                  .from('orders')
                  .select('created_at')
                  .eq('customer_id', customer.id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();

                return {
                  ...customer,
                  last_order_date: lastOrder?.created_at || null,
                };
              })
            );

            set({ 
              customers: customersWithLastOrder,
              loading: false 
            }, false, 'fetchCustomers:success');
            
            // Apply filters after setting customers
            get().applyFilters();
          } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Failed to load customers');
            set({ loading: false }, false, 'fetchCustomers:error');
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
                status: customerData.status || 'active',
                notes: customerData.notes || null,
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
            const newCustomer = { ...data, last_order_date: null };
            set({ 
              customers: [...customers, newCustomer],
              selectedCustomer: newCustomer
            }, false, 'addCustomer');
            
            // Apply filters after adding
            get().applyFilters();
            
            return newCustomer;
          } catch (error) {
            toast.error('Failed to add customer');
            return null;
          }
        },
        
        updateCustomer: async (id: string, updates: Partial<Customer>) => {
          try {
            const { error } = await supabase
              .from('customers')
              .update(updates)
              .eq('id', id);

            if (error) {
              toast.error('Failed to update customer');
              return;
            }

            toast.success('Customer updated successfully');
            
            // Update local customers list
            const { customers } = get();
            const updatedCustomers = customers.map(customer =>
              customer.id === id ? { ...customer, ...updates } : customer
            );
            
            set({ customers: updatedCustomers }, false, 'updateCustomer');
            
            // Apply filters after updating
            get().applyFilters();
          } catch (error) {
            toast.error('Failed to update customer');
          }
        },
        
        deleteCustomer: async (id: string) => {
          try {
            const { error } = await supabase
              .from('customers')
              .delete()
              .eq('id', id);

            if (error) {
              toast.error('Failed to delete customer');
              return;
            }

            toast.success('Customer deleted successfully');
            
            // Remove from local customers list
            const { customers } = get();
            const filteredCustomers = customers.filter(customer => customer.id !== id);
            
            set({ 
              customers: filteredCustomers,
              selectedCustomer: null
            }, false, 'deleteCustomer');
            
            // Apply filters after deleting
            get().applyFilters();
          } catch (error) {
            toast.error('Failed to delete customer');
          }
        },

        // Search and filter actions
        setSearchTerm: (term) => {
          set({ searchTerm: term }, false, 'setSearchTerm');
          get().applyFilters();
        },

        setFilters: (filters) => {
          set({ filters }, false, 'setFilters');
          get().applyFilters();
        },

        resetFilters: () => {
          set({
            filters: initialFilters,
            searchTerm: ''
          }, false, 'resetFilters');
          get().applyFilters();
        },

        applyFilters: () => {
          const { customers, filters, searchTerm } = get();
          let filtered = [...customers];

          // Text search
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(customer =>
              customer.name.toLowerCase().includes(searchLower) ||
              (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
              (customer.phone && customer.phone.includes(searchTerm))
            );
          }

          // Status filter
          if (filters.status !== "all") {
            filtered = filtered.filter(customer => customer.status === filters.status);
          }

          // Spending range filter
          if (filters.minSpent) {
            const minSpent = parseFloat(filters.minSpent);
            filtered = filtered.filter(customer => (customer.total_spent || 0) >= minSpent);
          }
          if (filters.maxSpent) {
            const maxSpent = parseFloat(filters.maxSpent);
            filtered = filtered.filter(customer => (customer.total_spent || 0) <= maxSpent);
          }

          // Orders range filter
          if (filters.minOrders) {
            const minOrders = parseInt(filters.minOrders);
            filtered = filtered.filter(customer => (customer.total_orders || 0) >= minOrders);
          }
          if (filters.maxOrders) {
            const maxOrders = parseInt(filters.maxOrders);
            filtered = filtered.filter(customer => (customer.total_orders || 0) <= maxOrders);
          }

          // Date range filter
          if (filters.dateFrom) {
            filtered = filtered.filter(customer =>
              new Date(customer.created_at) >= filters.dateFrom!
            );
          }
          if (filters.dateTo) {
            filtered = filtered.filter(customer =>
              new Date(customer.created_at) <= filters.dateTo!
            );
          }

          set({ filteredCustomers: filtered }, false, 'applyFilters');
        },

        // View actions
        setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),
        setLoading: (loading) => set({ loading }, false, 'setLoading'),

        // Selection actions
        setSelectedCustomer: (customer) => set({ selectedCustomer: customer }, false, 'setSelectedCustomer'),

        // Dialog actions
        setShowAddDialog: (show) => set({ showAddDialog: show }, false, 'setShowAddDialog'),
        setShowEditDialog: (show) => set({ showEditDialog: show }, false, 'setShowEditDialog'),
        setShowDetailsModal: (show) => set({ showDetailsModal: show }, false, 'setShowDetailsModal'),
        setShowExportDialog: (show) => set({ showExportDialog: show }, false, 'setShowExportDialog'),
        setShowStatusDialog: (show) => set({ showStatusDialog: show }, false, 'setShowStatusDialog'),
        setShowAnalytics: (show) => set({ showAnalytics: show }, false, 'setShowAnalytics'),

        // Customer details actions
        setCustomerOrders: (orders) => set({ customerOrders: orders }, false, 'setCustomerOrders'),

        fetchCustomerOrders: async (customerId: string) => {
          try {
            set({ ordersLoading: true }, false, 'fetchCustomerOrders:start');
            const { data, error } = await supabase
              .from('orders')
              .select(`
                id,
                order_number,
                total,
                status,
                payment_method,
                created_at
              `)
              .eq('customer_id', customerId)
              .order('created_at', { ascending: false });

            if (error) {
              console.error('Error fetching customer orders:', error);
              toast.error('Failed to load customer orders');
              return;
            }

            // Get items count for each order
            const ordersWithItemCount = await Promise.all(
              (data || []).map(async (order) => {
                const { count } = await supabase
                  .from('order_items')
                  .select('*', { count: 'exact', head: true })
                  .eq('order_id', order.id);

                return {
                  ...order,
                  items_count: count || 0,
                };
              })
            );

            set({
              customerOrders: ordersWithItemCount,
              ordersLoading: false
            }, false, 'fetchCustomerOrders:success');
          } catch (error) {
            console.error('Error fetching customer orders:', error);
            toast.error('Failed to load customer orders');
            set({ ordersLoading: false }, false, 'fetchCustomerOrders:error');
          }
        },

        setOrdersLoading: (loading) => set({ ordersLoading: loading }, false, 'setOrdersLoading'),

        // Reset actions
        resetCustomers: () => set(initialState, false, 'resetCustomers'),
      }),
      {
        name: 'customer-store',
        partialize: (state) => ({
          // Only persist UI preferences
          viewMode: state.viewMode,
          filters: state.filters,
        }),
      }
    ),
    { name: 'customer-store' }
  )
);

// Simple individual selectors - no object returns to avoid infinite loops
export const useCustomers = () => useCustomerStore((state) => state.customers);
export const useFilteredCustomers = () => useCustomerStore((state) => state.filteredCustomers);
export const useCustomerOrders = () => useCustomerStore((state) => state.customerOrders);
