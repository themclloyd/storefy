import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface Transaction {
  id: string;
  transaction_number: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  reference_id: string;
  reference_type: string;
  customer_id: string;
  customer_name: string;
  processed_by: string;
  description: string;
  notes: string;
  created_at: string;
}

export interface TransactionFilters {
  searchTerm: string;
  typeFilter: string;
  paymentMethodFilter: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

export interface TransactionHistory {
  id: string;
  action: string;
  description: string;
  performed_by: string;
  created_at: string;
}

// Store State
interface TransactionState {
  // Core data
  transactions: Transaction[];
  loading: boolean;
  
  // Filtering and search
  filters: TransactionFilters;
  filteredTransactions: Transaction[];
  
  // Selected transaction and details
  selectedTransaction: Transaction | null;
  showTransactionDetails: boolean;
  
  // Transaction history
  transactionHistory: TransactionHistory[];
  historyLoading: boolean;
  
  // Analytics data
  todayRevenue: number;
  totalTransactions: number;
  
  // Receipt dialog
  showReceiptDialog: boolean;
}

// Store Actions
interface TransactionActions {
  // Transaction data actions
  setTransactions: (transactions: Transaction[]) => void;
  fetchTransactions: (storeId: string) => Promise<void>;
  
  // Filtering actions
  setFilters: (filters: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  
  // Selection and UI actions
  setSelectedTransaction: (transaction: Transaction | null) => void;
  setShowTransactionDetails: (show: boolean) => void;
  setShowReceiptDialog: (show: boolean) => void;
  
  // Transaction history actions
  fetchTransactionHistory: (transactionId: string) => Promise<void>;
  setTransactionHistory: (history: TransactionHistory[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  
  // Transaction actions
  voidTransaction: (transactionId: string, reason: string) => Promise<void>;
  refundTransaction: (transactionId: string, amount: number, reason: string) => Promise<void>;
  updateTransactionNotes: (transactionId: string, notes: string) => Promise<void>;
  
  // Analytics actions
  calculateAnalytics: () => void;
  
  // Reset actions
  resetTransactions: () => void;
}

type TransactionStore = TransactionState & TransactionActions;

const initialFilters: TransactionFilters = {
  searchTerm: '',
  typeFilter: 'all',
  paymentMethodFilter: 'all',
  dateFrom: undefined,
  dateTo: undefined,
};

const initialState: TransactionState = {
  // Core data
  transactions: [],
  loading: true,
  
  // Filtering and search
  filters: initialFilters,
  filteredTransactions: [],
  
  // Selected transaction and details
  selectedTransaction: null,
  showTransactionDetails: false,
  
  // Transaction history
  transactionHistory: [],
  historyLoading: false,
  
  // Analytics data
  todayRevenue: 0,
  totalTransactions: 0,
  
  // Receipt dialog
  showReceiptDialog: false,
};

export const useTransactionStore = create<TransactionStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Transaction data actions
        setTransactions: (transactions) => {
          set({ transactions }, false, 'setTransactions');
          // Auto-apply filters and calculate analytics when transactions change
          setTimeout(() => {
            get().applyFilters();
            get().calculateAnalytics();
          }, 0);
        },
        
        fetchTransactions: async (storeId: string) => {
          try {
            set({ loading: true }, false, 'fetchTransactions:start');
            const { data, error } = await supabase
              .from('transactions')
              .select('*')
              .eq('store_id', storeId)
              .order('created_at', { ascending: false });

            if (error) {
              console.error('Error fetching transactions:', error);
              toast.error('Failed to load transactions');
              set({ loading: false }, false, 'fetchTransactions:error');
              return;
            }

            set({ 
              transactions: data || [],
              loading: false 
            }, false, 'fetchTransactions:success');
            
            // Apply filters and calculate analytics after setting transactions
            get().applyFilters();
            get().calculateAnalytics();
          } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Failed to load transactions');
            set({ loading: false }, false, 'fetchTransactions:error');
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
          const { transactions, filters } = get();
          let filtered = [...transactions];

          // Text search
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(transaction => 
              transaction.transaction_number.toLowerCase().includes(searchLower) ||
              transaction.customer_name?.toLowerCase().includes(searchLower) ||
              transaction.description?.toLowerCase().includes(searchLower) ||
              transaction.reference_id?.toLowerCase().includes(searchLower)
            );
          }

          // Type filter
          if (filters.typeFilter !== "all") {
            filtered = filtered.filter(transaction => transaction.transaction_type === filters.typeFilter);
          }

          // Payment method filter
          if (filters.paymentMethodFilter !== "all") {
            filtered = filtered.filter(transaction => transaction.payment_method === filters.paymentMethodFilter);
          }

          // Date range filter
          if (filters.dateFrom) {
            filtered = filtered.filter(transaction => 
              new Date(transaction.created_at) >= filters.dateFrom!
            );
          }
          if (filters.dateTo) {
            filtered = filtered.filter(transaction => 
              new Date(transaction.created_at) <= filters.dateTo!
            );
          }

          set({ filteredTransactions: filtered }, false, 'applyFilters');
        },
        
        // Selection and UI actions
        setSelectedTransaction: (transaction) => set({ selectedTransaction: transaction }, false, 'setSelectedTransaction'),
        setShowTransactionDetails: (show) => set({ showTransactionDetails: show }, false, 'setShowTransactionDetails'),
        setShowReceiptDialog: (show) => set({ showReceiptDialog: show }, false, 'setShowReceiptDialog'),
        
        // Transaction history actions
        fetchTransactionHistory: async (transactionId: string) => {
          try {
            set({ historyLoading: true }, false, 'fetchTransactionHistory:start');
            const { data, error } = await supabase
              .from('transaction_history')
              .select('*')
              .eq('transaction_id', transactionId)
              .order('created_at', { ascending: false });

            if (error) {
              console.error('Error fetching transaction history:', error);
              toast.error('Failed to load transaction history');
              return;
            }

            set({ 
              transactionHistory: data || [],
              historyLoading: false 
            }, false, 'fetchTransactionHistory:success');
          } catch (error) {
            console.error('Error fetching transaction history:', error);
            toast.error('Failed to load transaction history');
            set({ historyLoading: false }, false, 'fetchTransactionHistory:error');
          }
        },
        
        setTransactionHistory: (history) => set({ transactionHistory: history }, false, 'setTransactionHistory'),
        setHistoryLoading: (loading) => set({ historyLoading: loading }, false, 'setHistoryLoading'),

        // Transaction actions
        voidTransaction: async (transactionId: string, reason: string) => {
          try {
            const { selectedTransaction } = get();
            if (!selectedTransaction) return;

            const { error } = await supabase
              .from('transactions')
              .update({
                notes: `${selectedTransaction.notes ? `${selectedTransaction.notes  }\n\n` : ''}VOIDED: ${reason} - Voided on ${new Date().toISOString()}`
              })
              .eq('id', transactionId);

            if (error) {
              toast.error('Failed to void transaction');
              return;
            }

            // Log the void action in transaction history
            await supabase
              .from('transaction_history')
              .insert({
                transaction_id: transactionId,
                action: 'voided',
                description: `Transaction voided: ${reason}`,
                performed_by: 'current_user', // You might want to get this from auth store
              });

            toast.success('Transaction voided successfully');

            // Refresh transaction history
            get().fetchTransactionHistory(transactionId);
          } catch (error) {
            console.error('Error voiding transaction:', error);
            toast.error('Failed to void transaction');
          }
        },

        refundTransaction: async (transactionId: string, amount: number, reason: string) => {
          try {
            // Create a refund transaction
            const { selectedTransaction } = get();
            if (!selectedTransaction) return;

            const { error } = await supabase
              .from('transactions')
              .insert({
                transaction_type: 'refund',
                amount: -Math.abs(amount), // Negative amount for refund
                payment_method: selectedTransaction.payment_method,
                reference_id: selectedTransaction.id,
                reference_type: 'refund',
                customer_id: selectedTransaction.customer_id,
                customer_name: selectedTransaction.customer_name,
                description: `Refund for transaction ${selectedTransaction.transaction_number}: ${reason}`,
                notes: reason,
                store_id: selectedTransaction.store_id, // Assuming this exists
              });

            if (error) {
              toast.error('Failed to process refund');
              return;
            }

            // Log the refund action
            await supabase
              .from('transaction_history')
              .insert({
                transaction_id: transactionId,
                action: 'refunded',
                description: `Partial refund of ${amount}: ${reason}`,
                performed_by: 'current_user',
              });

            toast.success('Refund processed successfully');

            // Refresh transaction history
            get().fetchTransactionHistory(transactionId);
          } catch (error) {
            console.error('Error processing refund:', error);
            toast.error('Failed to process refund');
          }
        },

        updateTransactionNotes: async (transactionId: string, notes: string) => {
          try {
            const { error } = await supabase
              .from('transactions')
              .update({ notes })
              .eq('id', transactionId);

            if (error) {
              toast.error('Failed to update transaction notes');
              return;
            }

            // Update local state
            const { transactions, selectedTransaction } = get();
            const updatedTransactions = transactions.map(t =>
              t.id === transactionId ? { ...t, notes } : t
            );

            set({
              transactions: updatedTransactions,
              selectedTransaction: selectedTransaction?.id === transactionId
                ? { ...selectedTransaction, notes }
                : selectedTransaction
            }, false, 'updateTransactionNotes');

            // Log the update action
            await supabase
              .from('transaction_history')
              .insert({
                transaction_id: transactionId,
                action: 'notes_updated',
                description: 'Transaction notes updated',
                performed_by: 'current_user',
              });

            toast.success('Transaction notes updated');

            // Apply filters after updating
            get().applyFilters();

            // Refresh transaction history
            get().fetchTransactionHistory(transactionId);
          } catch (error) {
            console.error('Error updating transaction notes:', error);
            toast.error('Failed to update transaction notes');
          }
        },

        // Analytics actions
        calculateAnalytics: () => {
          const { filteredTransactions } = get();

          // Calculate today's transactions
          const today = new Date();
          const todayTransactions = filteredTransactions.filter(t => {
            const transactionDate = new Date(t.created_at);
            return transactionDate.toDateString() === today.toDateString();
          });

          // Calculate today's revenue (sales, layby payments, deposits)
          const todayRevenue = todayTransactions
            .filter(t => ['sale', 'layby_payment', 'layby_deposit'].includes(t.transaction_type))
            .reduce((sum, t) => sum + t.amount, 0);

          set({
            todayRevenue,
            totalTransactions: filteredTransactions.length
          }, false, 'calculateAnalytics');
        },

        // Reset actions
        resetTransactions: () => set(initialState, false, 'resetTransactions'),
      }),
      {
        name: 'transaction-store',
        partialize: (state) => ({
          // Only persist UI preferences
          filters: state.filters,
        }),
      }
    ),
    { name: 'transaction-store' }
  )
);

// Simple individual selectors - no object returns to avoid infinite loops
export const useTransactions = () => useTransactionStore((state) => state.transactions);
export const useFilteredTransactions = () => useTransactionStore((state) => state.filteredTransactions);
export const useTransactionHistory = () => useTransactionStore((state) => state.transactionHistory);
