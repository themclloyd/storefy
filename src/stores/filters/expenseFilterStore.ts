import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Expense } from '../expenseStore';

// Filter types
export interface ExpenseFilters {
  searchTerm: string;
  status: 'all' | 'pending' | 'paid';
  category: string;
  paymentMethod: string;
  dateRange: {
    from: string;
    to: string;
  };
  amountRange: {
    min: number;
    max: number;
  };
  sortBy: 'date' | 'amount' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface ExpenseFilterState {
  filters: ExpenseFilters;
  filteredExpenses: Expense[];
  isFiltering: boolean;
}

interface ExpenseFilterActions {
  // Filter actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: ExpenseFilters['status']) => void;
  setCategoryFilter: (category: string) => void;
  setPaymentMethodFilter: (method: string) => void;
  setDateRangeFilter: (range: ExpenseFilters['dateRange']) => void;
  setAmountRangeFilter: (range: ExpenseFilters['amountRange']) => void;
  setSortBy: (sortBy: ExpenseFilters['sortBy']) => void;
  setSortOrder: (order: ExpenseFilters['sortOrder']) => void;
  
  // Utility actions
  clearFilters: () => void;
  resetFilters: () => void;
  applyFilters: (expenses: Expense[]) => void;
  
  // Computed getters
  getFilteredExpenses: () => Expense[];
  hasActiveFilters: () => boolean;
  getFilterCount: () => number;
}

type ExpenseFilterStore = ExpenseFilterState & ExpenseFilterActions;

const initialFilters: ExpenseFilters = {
  searchTerm: '',
  status: 'all',
  category: 'all',
  paymentMethod: 'all',
  dateRange: {
    from: '',
    to: '',
  },
  amountRange: {
    min: 0,
    max: 0,
  },
  sortBy: 'date',
  sortOrder: 'desc',
};

const initialState: ExpenseFilterState = {
  filters: initialFilters,
  filteredExpenses: [],
  isFiltering: false,
};

export const useExpenseFilterStore = create<ExpenseFilterStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Filter actions
        setSearchTerm: (term) => {
          set((state) => ({
            filters: { ...state.filters, searchTerm: term }
          }), false, 'setSearchTerm');
        },
        
        setStatusFilter: (status) => {
          set((state) => ({
            filters: { ...state.filters, status }
          }), false, 'setStatusFilter');
        },
        
        setCategoryFilter: (category) => {
          set((state) => ({
            filters: { ...state.filters, category }
          }), false, 'setCategoryFilter');
        },
        
        setPaymentMethodFilter: (method) => {
          set((state) => ({
            filters: { ...state.filters, paymentMethod: method }
          }), false, 'setPaymentMethodFilter');
        },
        
        setDateRangeFilter: (range) => {
          set((state) => ({
            filters: { ...state.filters, dateRange: range }
          }), false, 'setDateRangeFilter');
        },
        
        setAmountRangeFilter: (range) => {
          set((state) => ({
            filters: { ...state.filters, amountRange: range }
          }), false, 'setAmountRangeFilter');
        },
        
        setSortBy: (sortBy) => {
          set((state) => ({
            filters: { ...state.filters, sortBy }
          }), false, 'setSortBy');
        },
        
        setSortOrder: (order) => {
          set((state) => ({
            filters: { ...state.filters, sortOrder: order }
          }), false, 'setSortOrder');
        },
        
        // Utility actions
        clearFilters: () => {
          set({ filters: initialFilters }, false, 'clearFilters');
        },
        
        resetFilters: () => {
          set({ 
            filters: initialFilters, 
            filteredExpenses: [],
            isFiltering: false 
          }, false, 'resetFilters');
        },
        
        applyFilters: (expenses) => {
          set({ isFiltering: true }, false, 'applyFilters:start');
          
          const { filters } = get();
          let filtered = [...expenses];
          
          // Apply search filter
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(expense =>
              expense.title.toLowerCase().includes(searchLower) ||
              expense.description?.toLowerCase().includes(searchLower) ||
              expense.vendor_name?.toLowerCase().includes(searchLower) ||
              expense.expense_number.toLowerCase().includes(searchLower)
            );
          }
          
          // Apply status filter
          if (filters.status !== 'all') {
            filtered = filtered.filter(expense => expense.status === filters.status);
          }
          
          // Apply category filter
          if (filters.category !== 'all') {
            filtered = filtered.filter(expense => expense.category_id === filters.category);
          }
          
          // Apply payment method filter
          if (filters.paymentMethod !== 'all') {
            filtered = filtered.filter(expense => expense.payment_method === filters.paymentMethod);
          }
          
          // Apply date range filter
          if (filters.dateRange.from && filters.dateRange.to) {
            const fromDate = new Date(filters.dateRange.from);
            const toDate = new Date(filters.dateRange.to);
            filtered = filtered.filter(expense => {
              const expenseDate = new Date(expense.expense_date);
              return expenseDate >= fromDate && expenseDate <= toDate;
            });
          }
          
          // Apply amount range filter
          if (filters.amountRange.max > 0) {
            filtered = filtered.filter(expense => 
              expense.amount >= filters.amountRange.min && 
              expense.amount <= filters.amountRange.max
            );
          }
          
          // Apply sorting
          filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (filters.sortBy) {
              case 'date':
                aValue = new Date(a.expense_date);
                bValue = new Date(b.expense_date);
                break;
              case 'amount':
                aValue = a.amount;
                bValue = b.amount;
                break;
              case 'title':
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
                break;
              default:
                return 0;
            }
            
            if (filters.sortOrder === 'asc') {
              return aValue > bValue ? 1 : -1;
            } else {
              return aValue < bValue ? 1 : -1;
            }
          });
          
          set({ 
            filteredExpenses: filtered, 
            isFiltering: false 
          }, false, 'applyFilters:complete');
        },
        
        // Computed getters
        getFilteredExpenses: () => get().filteredExpenses,
        
        hasActiveFilters: () => {
          const { filters } = get();
          return (
            filters.searchTerm !== '' ||
            filters.status !== 'all' ||
            filters.category !== 'all' ||
            filters.paymentMethod !== 'all' ||
            filters.dateRange.from !== '' ||
            filters.dateRange.to !== '' ||
            filters.amountRange.max > 0
          );
        },
        
        getFilterCount: () => {
          const { filters } = get();
          let count = 0;
          if (filters.searchTerm) count++;
          if (filters.status !== 'all') count++;
          if (filters.category !== 'all') count++;
          if (filters.paymentMethod !== 'all') count++;
          if (filters.dateRange.from || filters.dateRange.to) count++;
          if (filters.amountRange.max > 0) count++;
          return count;
        },
      }),
      {
        name: 'expense-filter-store',
        partialize: (state) => ({
          filters: state.filters, // Only persist filters, not filtered results
        }),
      }
    ),
    { name: 'expense-filter-store' }
  )
);

// Optimized selectors
export const useExpenseFilters = () => useExpenseFilterStore((state) => state.filters);
export const useFilteredExpenses = () => useExpenseFilterStore((state) => state.filteredExpenses);
export const useExpenseFilterActions = () => useExpenseFilterStore((state) => ({
  setSearchTerm: state.setSearchTerm,
  setStatusFilter: state.setStatusFilter,
  setCategoryFilter: state.setCategoryFilter,
  setPaymentMethodFilter: state.setPaymentMethodFilter,
  setDateRangeFilter: state.setDateRangeFilter,
  setAmountRangeFilter: state.setAmountRangeFilter,
  setSortBy: state.setSortBy,
  setSortOrder: state.setSortOrder,
  clearFilters: state.clearFilters,
  applyFilters: state.applyFilters,
}));
