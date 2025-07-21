import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
interface DialogState {
  // Team dialogs
  addTeamMember: boolean;
  editTeamMember: boolean;
  deleteTeamMember: boolean;
  
  // Payment dialogs
  addPaymentMethod: boolean;
  editPaymentMethod: boolean;
  deletePaymentMethod: boolean;
  
  // Showcase dialogs
  showcasePreview: boolean;
  
  // General dialogs
  confirmAction: boolean;
}

interface UIState {
  // Current active tab
  currentTab: string;
  
  // Dialog states
  dialogs: DialogState;
  
  // Selected items for editing/deleting
  selectedTeamMemberId: string | null;
  selectedPaymentMethodId: string | null;
  
  // UI preferences
  showAccountNumbers: boolean;
  compactView: boolean;
  
  // Loading states for specific UI actions
  savingSettings: boolean;
  
  // Confirmation dialog data
  confirmationData: {
    title: string;
    message: string;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
  } | null;
}

interface UIActions {
  // Tab management
  setCurrentTab: (tab: string) => void;
  
  // Dialog management
  openDialog: (dialog: keyof DialogState) => void;
  closeDialog: (dialog: keyof DialogState) => void;
  closeAllDialogs: () => void;
  
  // Selection management
  setSelectedTeamMember: (id: string | null) => void;
  setSelectedPaymentMethod: (id: string | null) => void;
  clearSelections: () => void;
  
  // UI preferences
  setShowAccountNumbers: (show: boolean) => void;
  setCompactView: (compact: boolean) => void;
  
  // Loading states
  setSavingSettings: (saving: boolean) => void;
  
  // Confirmation dialog
  showConfirmation: (data: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  hideConfirmation: () => void;
  
  // Reset
  reset: () => void;
}

type SettingsUIStore = UIState & UIActions;

const initialDialogState: DialogState = {
  addTeamMember: false,
  editTeamMember: false,
  deleteTeamMember: false,
  addPaymentMethod: false,
  editPaymentMethod: false,
  deletePaymentMethod: false,
  showcasePreview: false,
  confirmAction: false,
};

const initialState: UIState = {
  currentTab: 'team',
  dialogs: initialDialogState,
  selectedTeamMemberId: null,
  selectedPaymentMethodId: null,
  showAccountNumbers: false,
  compactView: false,
  savingSettings: false,
  confirmationData: null,
};

export const useSettingsUIStore = create<SettingsUIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Tab management
        setCurrentTab: (tab) => {
          set({ currentTab: tab }, false, 'ui/setCurrentTab');
        },

        // Dialog management
        openDialog: (dialog) => {
          set(
            state => ({
              dialogs: { ...state.dialogs, [dialog]: true }
            }),
            false,
            `ui/openDialog:${dialog}`
          );
        },

        closeDialog: (dialog) => {
          set(
            state => ({
              dialogs: { ...state.dialogs, [dialog]: false }
            }),
            false,
            `ui/closeDialog:${dialog}`
          );
        },

        closeAllDialogs: () => {
          set({ dialogs: initialDialogState }, false, 'ui/closeAllDialogs');
        },

        // Selection management
        setSelectedTeamMember: (id) => {
          set({ selectedTeamMemberId: id }, false, 'ui/setSelectedTeamMember');
        },

        setSelectedPaymentMethod: (id) => {
          set({ selectedPaymentMethodId: id }, false, 'ui/setSelectedPaymentMethod');
        },

        clearSelections: () => {
          set({
            selectedTeamMemberId: null,
            selectedPaymentMethodId: null,
          }, false, 'ui/clearSelections');
        },

        // UI preferences
        setShowAccountNumbers: (show) => {
          set({ showAccountNumbers: show }, false, 'ui/setShowAccountNumbers');
        },

        setCompactView: (compact) => {
          set({ compactView: compact }, false, 'ui/setCompactView');
        },

        // Loading states
        setSavingSettings: (saving) => {
          set({ savingSettings: saving }, false, 'ui/setSavingSettings');
        },

        // Confirmation dialog
        showConfirmation: (data) => {
          set({
            confirmationData: {
              ...data,
              onCancel: data.onCancel || (() => get().hideConfirmation()),
            },
            dialogs: { ...get().dialogs, confirmAction: true }
          }, false, 'ui/showConfirmation');
        },

        hideConfirmation: () => {
          set({
            confirmationData: null,
            dialogs: { ...get().dialogs, confirmAction: false }
          }, false, 'ui/hideConfirmation');
        },

        // Reset
        reset: () => {
          set(initialState, false, 'ui/reset');
        },
      }),
      {
        name: 'settings-ui-store',
        partialize: (state) => ({
          currentTab: state.currentTab,
          showAccountNumbers: state.showAccountNumbers,
          compactView: state.compactView,
        }),
      }
    ),
    { name: 'settings-ui-store' }
  )
);

// Selectors
export const useCurrentTab = () => useSettingsUIStore(state => state.currentTab);
export const useDialogState = (dialog: keyof DialogState) => 
  useSettingsUIStore(state => state.dialogs[dialog]);
export const useSelectedTeamMember = () => useSettingsUIStore(state => state.selectedTeamMemberId);
export const useSelectedPaymentMethod = () => useSettingsUIStore(state => state.selectedPaymentMethodId);
export const useShowAccountNumbers = () => useSettingsUIStore(state => state.showAccountNumbers);
export const useCompactView = () => useSettingsUIStore(state => state.compactView);
export const useSavingSettings = () => useSettingsUIStore(state => state.savingSettings);
export const useConfirmationData = () => useSettingsUIStore(state => state.confirmationData);

// Actions
export const useSettingsUIActions = () => useSettingsUIStore(state => ({
  setCurrentTab: state.setCurrentTab,
  openDialog: state.openDialog,
  closeDialog: state.closeDialog,
  closeAllDialogs: state.closeAllDialogs,
  setSelectedTeamMember: state.setSelectedTeamMember,
  setSelectedPaymentMethod: state.setSelectedPaymentMethod,
  clearSelections: state.clearSelections,
  setShowAccountNumbers: state.setShowAccountNumbers,
  setCompactView: state.setCompactView,
  setSavingSettings: state.setSavingSettings,
  showConfirmation: state.showConfirmation,
  hideConfirmation: state.hideConfirmation,
  reset: state.reset,
}));

// Compound selectors for common use cases
export const useTeamDialogs = () => useSettingsUIStore(state => ({
  addTeamMember: state.dialogs.addTeamMember,
  editTeamMember: state.dialogs.editTeamMember,
  deleteTeamMember: state.dialogs.deleteTeamMember,
}));

export const usePaymentDialogs = () => useSettingsUIStore(state => ({
  addPaymentMethod: state.dialogs.addPaymentMethod,
  editPaymentMethod: state.dialogs.editPaymentMethod,
  deletePaymentMethod: state.dialogs.deletePaymentMethod,
}));
