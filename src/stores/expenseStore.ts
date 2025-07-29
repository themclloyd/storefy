import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface Expense {
  id: string;
  expense_number: string;
  title: string;
  description: string | null;
  amount: number;
  expense_date: string;
  category_id: string | null;
  payment_method: string;
  vendor_name: string | null;
  vendor_contact: string | null;
  receipt_number: string | null;
  receipt_url: string | null;
  tax_amount: number;
  is_tax_deductible: boolean;
  status: 'pending' | 'paid';
  notes: string | null;
  created_at: string;
  created_by: string;
  expense_categories?: {
    name: string;
    color: string;
  } | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  expense_count?: number;
}

export interface RecurringExpense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  category_id: string | null;
  payment_method: string;
  vendor_name: string | null;
  vendor_contact: string | null;
  is_active: boolean;
  auto_create: boolean;
  notes: string | null;
  created_at: string;
  expense_categories?: {
    name: string;
    color: string;
  } | null;
}

export interface ExpenseFilters {
  searchTerm: string;
  selectedCategory: string | null;
  selectedStatus: string | null;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

export interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  monthlyTotal: number;
  yearlyTotal: number;
  averageExpense: number;
  taxDeductibleAmount: number;
}

// Core expense data store - focused only on data management
interface ExpenseState {
  // Core data
  expenses: Expense[];
  categories: ExpenseCategory[];
  recurringExpenses: RecurringExpense[];
  loading: boolean;
  error: string | null;

  // Statistics (computed from data)
  stats: ExpenseStats;

  // Last updated timestamp for cache invalidation
  lastUpdated: number | null;
}

// Store Actions
interface ExpenseActions {
  // Expense data actions
  setExpenses: (expenses: Expense[]) => void;
  fetchExpenses: (storeId: string) => Promise<void>;
  addExpense: (storeId: string, expenseData: any) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Category actions
  setCategories: (categories: ExpenseCategory[]) => void;
  fetchCategories: (storeId: string) => Promise<void>;
  addCategory: (storeId: string, categoryData: any) => Promise<void>;
  updateCategory: (id: string, updates: Partial<ExpenseCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Recurring expense actions
  setRecurringExpenses: (expenses: RecurringExpense[]) => void;
  fetchRecurringExpenses: (storeId: string) => Promise<void>;
  addRecurringExpense: (storeId: string, expenseData: any) => Promise<void>;
  
  // Filtering actions
  setFilters: (filters: Partial<ExpenseFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  
  // Statistics actions
  calculateStats: () => void;
  
  // Selection and UI actions
  setSelectedExpense: (expense: Expense | null) => void;
  setSelectedCategory: (category: ExpenseCategory | null) => void;
  setShowAddExpenseDialog: (show: boolean) => void;
  setShowEditExpenseDialog: (show: boolean) => void;
  setShowExpenseDetailsModal: (show: boolean) => void;
  setShowCategoriesView: (show: boolean) => void;
  setShowAddCategoryDialog: (show: boolean) => void;
  setShowEditCategoryDialog: (show: boolean) => void;
  setCurrentTab: (tab: 'expenses' | 'recurring') => void;
  
  // Export actions
  exportExpenses: () => void;
  
  // Reset actions
  resetExpenses: () => void;
}

type ExpenseStore = ExpenseState & ExpenseActions;

const initialFilters: ExpenseFilters = {
  searchTerm: '',
  selectedCategory: null,
  selectedStatus: null,
  dateRange: {
    from: undefined,
    to: undefined,
  },
};

const initialStats: ExpenseStats = {
  totalExpenses: 0,
  totalAmount: 0,
  pendingAmount: 0,
  paidAmount: 0,
  monthlyTotal: 0,
  yearlyTotal: 0,
  averageExpense: 0,
  taxDeductibleAmount: 0,
};

const initialState: ExpenseState = {
  // Core data
  expenses: [],
  categories: [],
  recurringExpenses: [],
  loading: true,
  
  // Filtering and search
  filters: initialFilters,
  filteredExpenses: [],
  
  // Statistics
  stats: initialStats,
  
  // Selected expense and details
  selectedExpense: null,
  
  // Dialog states
  showAddExpenseDialog: false,
  showEditExpenseDialog: false,
  showExpenseDetailsModal: false,
  showCategoriesView: false,
  showAddCategoryDialog: false,
  showEditCategoryDialog: false,
  selectedCategory: null,
  
  // Current view
  currentTab: 'expenses',
};

export const useExpenseStore = create<ExpenseStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Expense data actions
        setExpenses: (expenses) => {
          set({ expenses }, false, 'setExpenses');
          // Auto-apply filters and calculate stats when expenses change
          setTimeout(() => {
            get().applyFilters();
            get().calculateStats();
          }, 0);
        },
        
        fetchExpenses: async (storeId: string) => {
          try {
            set({ loading: true }, false, 'fetchExpenses:start');
            const { data, error } = await supabase
              .from('expenses')
              .select(`
                *,
                expense_categories (name, color)
              `)
              .eq('store_id', storeId)
              .order('expense_date', { ascending: false });

            if (error) {
              console.error('Error fetching expenses:', error);
              toast.error('Failed to load expenses');
              set({ loading: false }, false, 'fetchExpenses:error');
              return;
            }

            set({ 
              expenses: data || [],
              loading: false 
            }, false, 'fetchExpenses:success');
            
            // Apply filters and calculate stats after setting expenses
            get().applyFilters();
            get().calculateStats();
          } catch (error) {
            console.error('Error fetching expenses:', error);
            toast.error('Failed to load expenses');
            set({ loading: false }, false, 'fetchExpenses:error');
          }
        },

        addExpense: async (storeId: string, expenseData: any) => {
          try {
            // Generate expense number
            const { data: expenseNumberData, error: expenseNumberError } = await supabase
              .rpc('generate_expense_number', { store_id: storeId });

            if (expenseNumberError) {
              toast.error('Failed to generate expense number');
              return;
            }

            // Create expense
            const { error: expenseError } = await supabase
              .from('expenses')
              .insert({
                store_id: storeId,
                expense_number: expenseNumberData,
                title: expenseData.title,
                description: expenseData.description || null,
                amount: expenseData.amount,
                expense_date: expenseData.expense_date,
                category_id: expenseData.category_id === "none" ? null : expenseData.category_id || null,
                payment_method: expenseData.payment_method,
                vendor_name: expenseData.vendor_name || null,
                vendor_contact: expenseData.vendor_contact || null,
                receipt_number: expenseData.receipt_number || null,
                tax_amount: expenseData.tax_amount,
                is_tax_deductible: expenseData.is_tax_deductible,
                notes: expenseData.notes || null,
                created_by: expenseData.created_by,
                status: 'pending'
              });

            if (expenseError) {
              toast.error('Failed to create expense');
              return;
            }

            toast.success('Expense created successfully');

            // Refresh expenses
            get().fetchExpenses(storeId);
          } catch (error) {
            console.error('Error creating expense:', error);
            toast.error('Failed to create expense');
          }
        },

        updateExpense: async (id: string, updates: Partial<Expense>) => {
          try {
            const { error } = await supabase
              .from('expenses')
              .update(updates)
              .eq('id', id);

            if (error) {
              toast.error('Failed to update expense');
              return;
            }

            toast.success('Expense updated successfully');

            // Update local state
            const { expenses } = get();
            const updatedExpenses = expenses.map(expense =>
              expense.id === id ? { ...expense, ...updates } : expense
            );
            get().setExpenses(updatedExpenses);
          } catch (error) {
            console.error('Error updating expense:', error);
            toast.error('Failed to update expense');
          }
        },

        deleteExpense: async (id: string) => {
          try {
            const { error } = await supabase
              .from('expenses')
              .delete()
              .eq('id', id);

            if (error) {
              toast.error('Failed to delete expense');
              return;
            }

            toast.success('Expense deleted successfully');

            // Update local state
            const { expenses } = get();
            const updatedExpenses = expenses.filter(expense => expense.id !== id);
            get().setExpenses(updatedExpenses);
          } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error('Failed to delete expense');
          }
        },

        // Category actions
        setCategories: (categories) => set({ categories }, false, 'setCategories'),

        fetchCategories: async (storeId: string) => {
          try {
            const { data, error } = await supabase
              .from('expense_categories')
              .select('*')
              .eq('store_id', storeId)
              .order('name');

            if (error) {
              console.error('Error fetching categories:', error);
              toast.error('Failed to load categories');
              return;
            }

            set({ categories: data || [] }, false, 'fetchCategories:success');
          } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
          }
        },

        addCategory: async (storeId: string, categoryData: any) => {
          try {
            const { error } = await supabase
              .from('expense_categories')
              .insert({
                store_id: storeId,
                name: categoryData.name,
                description: categoryData.description || null,
                color: categoryData.color,
                is_active: categoryData.is_active,
                created_by: categoryData.created_by,
              });

            if (error) {
              toast.error('Failed to create category');
              return;
            }

            toast.success('Category created successfully');

            // Refresh categories
            get().fetchCategories(storeId);
          } catch (error) {
            console.error('Error creating category:', error);
            toast.error('Failed to create category');
          }
        },

        updateCategory: async (id: string, updates: Partial<ExpenseCategory>) => {
          try {
            const { error } = await supabase
              .from('expense_categories')
              .update(updates)
              .eq('id', id);

            if (error) {
              toast.error('Failed to update category');
              return;
            }

            toast.success('Category updated successfully');

            // Update local state
            const { categories } = get();
            const updatedCategories = categories.map(category =>
              category.id === id ? { ...category, ...updates } : category
            );
            set({ categories: updatedCategories }, false, 'updateCategory');
          } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Failed to update category');
          }
        },

        deleteCategory: async (id: string) => {
          try {
            const { error } = await supabase
              .from('expense_categories')
              .delete()
              .eq('id', id);

            if (error) {
              toast.error('Failed to delete category');
              return;
            }

            toast.success('Category deleted successfully');

            // Update local state
            const { categories } = get();
            const updatedCategories = categories.filter(category => category.id !== id);
            set({ categories: updatedCategories }, false, 'deleteCategory');
          } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
          }
        },

        // Recurring expense actions
        setRecurringExpenses: (expenses) => set({ recurringExpenses: expenses }, false, 'setRecurringExpenses'),

        fetchRecurringExpenses: async (storeId: string) => {
          try {
            const { data, error } = await supabase
              .from('recurring_expenses')
              .select(`
                *,
                expense_categories (name, color)
              `)
              .eq('store_id', storeId)
              .order('next_due_date', { ascending: true });

            if (error) {
              console.error('Error fetching recurring expenses:', error);
              toast.error('Failed to load recurring expenses');
              return;
            }

            set({ recurringExpenses: data || [] }, false, 'fetchRecurringExpenses:success');
          } catch (error) {
            console.error('Error fetching recurring expenses:', error);
            toast.error('Failed to load recurring expenses');
          }
        },

        addRecurringExpense: async (storeId: string, expenseData: any) => {
          try {
            const { error } = await supabase
              .from('recurring_expenses')
              .insert({
                store_id: storeId,
                title: expenseData.title,
                description: expenseData.description || null,
                amount: expenseData.amount,
                frequency: expenseData.frequency,
                start_date: expenseData.start_date,
                end_date: expenseData.end_date || null,
                next_due_date: expenseData.next_due_date,
                category_id: expenseData.category_id === "none" ? null : expenseData.category_id || null,
                payment_method: expenseData.payment_method,
                vendor_name: expenseData.vendor_name || null,
                vendor_contact: expenseData.vendor_contact || null,
                is_active: expenseData.is_active,
                auto_create: expenseData.auto_create,
                notes: expenseData.notes || null,
                created_by: expenseData.created_by,
              });

            if (error) {
              toast.error('Failed to create recurring expense');
              return;
            }

            toast.success('Recurring expense created successfully');

            // Refresh recurring expenses
            get().fetchRecurringExpenses(storeId);
          } catch (error) {
            console.error('Error creating recurring expense:', error);
            toast.error('Failed to create recurring expense');
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
          const { expenses, filters } = get();
          let filtered = [...expenses];

          // Text search
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(expense =>
              expense.title.toLowerCase().includes(searchLower) ||
              expense.description?.toLowerCase().includes(searchLower) ||
              expense.vendor_name?.toLowerCase().includes(searchLower) ||
              expense.expense_number.toLowerCase().includes(searchLower)
            );
          }

          // Category filter
          if (filters.selectedCategory) {
            filtered = filtered.filter(expense => expense.category_id === filters.selectedCategory);
          }

          // Status filter
          if (filters.selectedStatus) {
            filtered = filtered.filter(expense => expense.status === filters.selectedStatus);
          }

          // Date range filter
          if (filters.dateRange.from || filters.dateRange.to) {
            filtered = filtered.filter(expense => {
              const expenseDate = new Date(expense.expense_date);
              const matchesFrom = !filters.dateRange.from || expenseDate >= filters.dateRange.from;
              const matchesTo = !filters.dateRange.to || expenseDate <= filters.dateRange.to;
              return matchesFrom && matchesTo;
            });
          }

          set({ filteredExpenses: filtered }, false, 'applyFilters');
        },

        // Statistics actions
        calculateStats: () => {
          const { expenses } = get();
          const now = new Date();
          const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const currentYear = new Date(now.getFullYear(), 0, 1);

          const newStats: ExpenseStats = {
            totalExpenses: expenses.length,
            totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
            pendingAmount: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
            paidAmount: expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
            monthlyTotal: expenses
              .filter(e => new Date(e.expense_date) >= currentMonth)
              .reduce((sum, e) => sum + e.amount, 0),
            yearlyTotal: expenses
              .filter(e => new Date(e.expense_date) >= currentYear)
              .reduce((sum, e) => sum + e.amount, 0),
            averageExpense: expenses.length > 0 ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length : 0,
            taxDeductibleAmount: expenses
              .filter(e => e.is_tax_deductible)
              .reduce((sum, e) => sum + e.amount, 0)
          };

          set({ stats: newStats }, false, 'calculateStats');
        },

        // Selection and UI actions
        setSelectedExpense: (expense) => set({ selectedExpense: expense }, false, 'setSelectedExpense'),
        setSelectedCategory: (category) => set({ selectedCategory: category }, false, 'setSelectedCategory'),
        setShowAddExpenseDialog: (show) => set({ showAddExpenseDialog: show }, false, 'setShowAddExpenseDialog'),
        setShowEditExpenseDialog: (show) => set({ showEditExpenseDialog: show }, false, 'setShowEditExpenseDialog'),
        setShowExpenseDetailsModal: (show) => set({ showExpenseDetailsModal: show }, false, 'setShowExpenseDetailsModal'),
        setShowCategoriesView: (show) => set({ showCategoriesView: show }, false, 'setShowCategoriesView'),
        setShowAddCategoryDialog: (show) => set({ showAddCategoryDialog: show }, false, 'setShowAddCategoryDialog'),
        setShowEditCategoryDialog: (show) => set({ showEditCategoryDialog: show }, false, 'setShowEditCategoryDialog'),
        setCurrentTab: (tab) => set({ currentTab: tab }, false, 'setCurrentTab'),

        // Export actions
        exportExpenses: () => {
          const { filteredExpenses } = get();

          if (filteredExpenses.length === 0) {
            toast.error('No expenses to export');
            return;
          }

          // Create CSV content
          const headers = ['Date', 'Title', 'Category', 'Amount', 'Status', 'Payment Method', 'Vendor', 'Tax Deductible'];
          const csvContent = [
            headers.join(','),
            ...filteredExpenses.map(expense => [
              expense.expense_date,
              `"${expense.title}"`,
              expense.expense_categories?.name || 'Uncategorized',
              expense.amount,
              expense.status,
              expense.payment_method,
              expense.vendor_name || '',
              expense.is_tax_deductible ? 'Yes' : 'No'
            ].join(','))
          ].join('\n');

          // Download CSV
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          toast.success('Expenses exported successfully');
        },

        // Reset actions
        resetExpenses: () => set(initialState, false, 'resetExpenses'),
      }),
      {
        name: 'expense-store',
        partialize: (state) => ({
          // Only persist UI preferences
          filters: state.filters,
          currentTab: state.currentTab,
        }),
      }
    ),
    { name: 'expense-store' }
  )
);

// Simple individual selectors - no object returns to avoid infinite loops
export const useExpenses = () => useExpenseStore((state) => state.expenses);
export const useFilteredExpenses = () => useExpenseStore((state) => state.filteredExpenses);
export const useExpenseCategories = () => useExpenseStore((state) => state.categories);
export const useRecurringExpenses = () => useExpenseStore((state) => state.recurringExpenses);
export const useExpenseStats = () => useExpenseStore((state) => state.stats);

// Action selectors
export const useFetchExpenses = () => useExpenseStore((state) => state.fetchExpenses);
