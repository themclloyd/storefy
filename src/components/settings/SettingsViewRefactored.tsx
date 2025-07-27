import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { TabsContent } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCurrentStore } from "@/stores/storeStore";
import { useSettingsStore } from "@/stores/settingsStore";

// Import refactored components
import { SettingsNavigation } from "./components/SettingsNavigation";
import { TeamManagement } from "./components/TeamManagement";
import { StoreSettings } from "./components/StoreSettings";
import { ActivityLogs } from "./components/ActivityLogs";
import { PaymentMethodsSettings } from "./PaymentMethodsSettingsRefactored";
import { ShowcaseSettings } from "./ShowcaseSettingsRefactored";
import { SubscriptionSettings } from "./components/SubscriptionSettings";
import { PrivacySettings } from "@/components/analytics/ConsentBanner";

export function SettingsView() {
  const currentStore = useCurrentStore();
  const [searchParams] = useSearchParams();

  // Use Zustand store state
  const currentTab = useSettingsStore(state => state.currentTab);
  const loading = useSettingsStore(state => state.loading);

  // Actions from Zustand
  const setCurrentTab = useSettingsStore(state => state.setCurrentTab);
  const setStoreSettings = useSettingsStore(state => state.setStoreSettings);
  const fetchTeamMembers = useSettingsStore(state => state.fetchTeamMembers);
  const fetchActivityLogs = useSettingsStore(state => state.fetchActivityLogs);

  // Handle URL parameters for direct tab navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['team', 'store', 'showcase', 'payments', 'subscription', 'notifications', 'activity'].includes(tab)) {
      setCurrentTab(tab);
    }
  }, [searchParams, setCurrentTab]);

  useEffect(() => {
    if (currentStore?.id) {
      fetchTeamMembers(currentStore.id);
    }
  }, [currentStore?.id, fetchTeamMembers]);

  useEffect(() => {
    if (currentTab === 'activity' && currentStore?.id) {
      fetchActivityLogs(currentStore.id);
    }
  }, [currentTab, currentStore?.id, fetchActivityLogs]);

  useEffect(() => {
    if (currentStore) {
      setStoreSettings({
        storeName: currentStore.name || '',
        storeAddress: currentStore.address || '',
        storePhone: currentStore.phone || '',
        storeEmail: currentStore.email || '',
        storeCurrency: currentStore.currency || 'MWK',
        storeTaxRate: currentStore.tax_rate?.toString() || '8.25',
      });
    }
  }, [currentStore, setStoreSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your store settings, team, and preferences
            </p>
          </div>
        </div>

        <SettingsNavigation 
          currentTab={currentTab} 
          onTabChange={setCurrentTab} 
        />

        <TabsContent value="team" className="space-y-6">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="store" className="space-y-6">
          <StoreSettings />
        </TabsContent>

        <TabsContent value="showcase" className="space-y-6">
          <ShowcaseSettings />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentMethodsSettings />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityLogs />
        </TabsContent>

        {/* Delete functionality will be implemented later */}
      </div>
    </TooltipProvider>
  );
}
