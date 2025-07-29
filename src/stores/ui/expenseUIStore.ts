import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Expense, ExpenseCategory } from '../expenseStore';

// UI-specific state for expense management
interface ExpenseUIState {
  // Dialog states
  showAddExpenseDialog: boolean;
  showEditExpenseDialog: boolean;
  showExpenseDetailsModal: boolean;
  showCategoriesView: boolean;
  showAddCategoryDialog: boolean;
  showEditCategoryDialog: boolean;
  
  // Selected items
  selectedExpense: Expense | null;
  selectedCategory: ExpenseCategory | null;
  
  // Current view
  currentTab: 'expenses' | 'recurring';
  
  // Loading states
  isSubmitting: boolean;
  isDeletingExpense: boolean;
  isDeletingCategory: boolean;
}

interface ExpenseUIActions {
  // Dialog actions
  openAddExpenseDialog: () => void;
  closeAddExpenseDialog: () => void;
  openEditExpenseDialog: (expense: Expense) => void;
  closeEditExpenseDialog: () => void;
  openExpenseDetailsModal: (expense: Expense) => void;
  closeExpenseDetailsModal: () => void;
  openCategoriesView: () => void;
  closeCategoriesView: () => void;
  openAddCategoryDialog: () => void;
  closeAddCategoryDialog: () => void;
  openEditCategoryDialog: (category: ExpenseCategory) => void;
  closeEditCategoryDialog: () => void;
  
  // Selection actions
  setSelectedExpense: (expense: Expense | null) => void;
  setSelectedCategory: (category: ExpenseCategory | null) => void;
  
  // Tab actions
  setCurrentTab: (tab: 'expenses' | 'recurring') => void;
  
  // Loading actions
  setSubmitting: (isSubmitting: boolean) => void;
  setDeletingExpense: (isDeleting: boolean) => void;
  setDeletingCategory: (isDeleting: boolean) => void;
  
  // Utility actions
  closeAllDialogs: () => void;
  resetState: () => void;
}

type ExpenseUIStore = ExpenseUIState & ExpenseUIActions;

const initialState: ExpenseUIState = {
  // Dialog states
  showAddExpenseDialog: false,
  showEditExpenseDialog: false,
  showExpenseDetailsModal: false,
  showCategoriesView: false,
  showAddCategoryDialog: false,
  showEditCategoryDialog: false,
  
  // Selected items
  selectedExpense: null,
  selectedCategory: null,
  
  // Current view
  currentTab: 'expenses',
  
  // Loading states
  isSubmitting: false,
  isDeletingExpense: false,
  isDeletingCategory: false,
};

export const useExpenseUIStore = create<ExpenseUIStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Dialog actions
      openAddExpenseDialog: () => set({ showAddExpenseDialog: true }, false, 'openAddExpenseDialog'),
      closeAddExpenseDialog: () => set({ showAddExpenseDialog: false }, false, 'closeAddExpenseDialog'),
      
      openEditExpenseDialog: (expense) => set({ 
        showEditExpenseDialog: true, 
        selectedExpense: expense 
      }, false, 'openEditExpenseDialog'),
      closeEditExpenseDialog: () => set({ 
        showEditExpenseDialog: false, 
        selectedExpense: null 
      }, false, 'closeEditExpenseDialog'),
      
      openExpenseDetailsModal: (expense) => set({ 
        showExpenseDetailsModal: true, 
        selectedExpense: expense 
      }, false, 'openExpenseDetailsModal'),
      closeExpenseDetailsModal: () => set({ 
        showExpenseDetailsModal: false, 
        selectedExpense: null 
      }, false, 'closeExpenseDetailsModal'),
      
      openCategoriesView: () => set({ showCategoriesView: true }, false, 'openCategoriesView'),
      closeCategoriesView: () => set({ showCategoriesView: false }, false, 'closeCategoriesView'),
      
      openAddCategoryDialog: () => set({ showAddCategoryDialog: true }, false, 'openAddCategoryDialog'),
      closeAddCategoryDialog: () => set({ showAddCategoryDialog: false }, false, 'closeAddCategoryDialog'),
      
      openEditCategoryDialog: (category) => set({ 
        showEditCategoryDialog: true, 
        selectedCategory: category 
      }, false, 'openEditCategoryDialog'),
      closeEditCategoryDialog: () => set({ 
        showEditCategoryDialog: false, 
        selectedCategory: null 
      }, false, 'closeEditCategoryDialog'),
      
      // Selection actions
      setSelectedExpense: (expense) => set({ selectedExpense: expense }, false, 'setSelectedExpense'),
      setSelectedCategory: (category) => set({ selectedCategory: category }, false, 'setSelectedCategory'),
      
      // Tab actions
      setCurrentTab: (tab) => set({ currentTab: tab }, false, 'setCurrentTab'),
      
      // Loading actions
      setSubmitting: (isSubmitting) => set({ isSubmitting }, false, 'setSubmitting'),
      setDeletingExpense: (isDeletingExpense) => set({ isDeletingExpense }, false, 'setDeletingExpense'),
      setDeletingCategory: (isDeletingCategory) => set({ isDeletingCategory }, false, 'setDeletingCategory'),
      
      // Utility actions
      closeAllDialogs: () => set({
        showAddExpenseDialog: false,
        showEditExpenseDialog: false,
        showExpenseDetailsModal: false,
        showCategoriesView: false,
        showAddCategoryDialog: false,
        showEditCategoryDialog: false,
        selectedExpense: null,
        selectedCategory: null,
      }, false, 'closeAllDialogs'),
      
      resetState: () => set(initialState, false, 'resetState'),
    }),
    { name: 'expense-ui-store' }
  )
);

// Optimized selectors for better performance
export const useExpenseDialogs = () => useExpenseUIStore((state) => ({
  showAddExpenseDialog: state.showAddExpenseDialog,
  showEditExpenseDialog: state.showEditExpenseDialog,
  showExpenseDetailsModal: state.showExpenseDetailsModal,
  showCategoriesView: state.showCategoriesView,
  showAddCategoryDialog: state.showAddCategoryDialog,
  showEditCategoryDialog: state.showEditCategoryDialog,
}));

export const useExpenseSelection = () => useExpenseUIStore((state) => ({
  selectedExpense: state.selectedExpense,
  selectedCategory: state.selectedCategory,
}));

export const useExpenseLoadingStates = () => useExpenseUIStore((state) => ({
  isSubmitting: state.isSubmitting,
  isDeletingExpense: state.isDeletingExpense,
  isDeletingCategory: state.isDeletingCategory,
}));
