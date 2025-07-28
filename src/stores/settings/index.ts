// Re-export all stores and their types
export * from './teamStore';
export * from './storeConfigStore';
export * from './settingsUIStore';

// Convenience hooks that combine multiple stores
import { useTeamMembers, useTeamRoleStats, useTeamLoading } from './teamStore';
import { useStoreConfig, useStoreConfigLoading } from './storeConfigStore';
import { useCurrentTab, useDialogState } from './settingsUIStore';

// Combined selectors for common use cases
export const useSettingsOverview = () => {
  const teamLoading = useTeamLoading();
  const storeConfigLoading = useStoreConfigLoading();

  return {
    teamMembers: useTeamMembers(),
    roleStats: useTeamRoleStats(),
    storeConfig: useStoreConfig(),
    currentTab: useCurrentTab(),
    loading: teamLoading || storeConfigLoading,
  };
};

// Dialog management helpers
export const useTeamMemberDialog = () => ({
  isOpen: useDialogState('addTeamMember'),
  // Add more dialog-specific logic here
});

export const usePaymentMethodDialog = () => ({
  isOpen: useDialogState('addPaymentMethod'),
  // Add more dialog-specific logic here
});

// Migration helpers for backward compatibility
export const useSettingsStore = (selector: any) => {
  console.warn('useSettingsStore is deprecated. Use specific store hooks instead.');
  // This is a temporary bridge - should be removed after migration
  return selector({
    teamMembers: useTeamMembers(),
    roleStats: useTeamRoleStats(),
    loading: useTeamLoading(),
    currentTab: useCurrentTab(),
  });
};
