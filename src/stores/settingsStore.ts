import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface TeamMember {
  id: string;
  user_id?: string | null;
  role: 'owner' | 'manager' | 'cashier';
  is_active: boolean;
  created_at: string;
  name: string;
  phone?: string;
  email?: string;
  pin?: string;
}

export interface RoleStats {
  owner: number;
  manager: number;
  cashier: number;
  total: number;
}

export interface ActivityLog {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
  actor_name: string;
  actor_id: string | null;
  target_type: string;
  target_name: string | null;
  metadata: any;
}

export interface PaymentMethod {
  id: string;
  name: string;
  provider: string;
  account_number: string;
  is_active: boolean;
  created_at: string;
}

export interface ShowcaseTheme {
  primaryColor: string;
  secondaryColor: string;
  layout: 'grid' | 'list' | 'masonry';
}

export interface ContactInfo {
  showPhone: boolean;
  showEmail: boolean;
  showAddress: boolean;
}

export interface ShowcaseAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  lastVisited: string | null;
  popularProducts: Array<{
    id: string;
    name: string;
    views: number;
  }>;
}

export interface ShowcaseSettings {
  enableShowcase: boolean;
  showcaseSlug: string;
  showcaseDescription: string;
  showcaseLogoUrl: string;
  showcaseBannerUrl: string;
  seoTitle: string;
  seoDescription: string;
  theme: ShowcaseTheme;
  contactInfo: ContactInfo;
  analytics: ShowcaseAnalytics;
}

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeCurrency: string;
  storeTaxRate: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  salesReports: boolean;
  systemUpdates: boolean;
}

export interface PrivacySettings {
  analyticsEnabled: boolean;
  performanceTracking: boolean;
  usageTracking: boolean;
  errorTracking: boolean;
  geographicTracking: boolean;
}

// Store State
interface SettingsState {
  // Core data
  teamMembers: TeamMember[];
  activityLogs: ActivityLog[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  
  // Store settings
  storeSettings: StoreSettings;
  updatingStore: boolean;
  
  // Showcase settings
  showcaseSettings: ShowcaseSettings;
  showcaseLoading: boolean;
  showcaseSaving: boolean;
  
  // Notification settings
  notificationSettings: NotificationSettings;
  
  // Privacy settings
  privacySettings: PrivacySettings;
  
  // UI state
  currentTab: string;
  roleStats: RoleStats;
  
  // Dialog states
  showAddTeamMemberDialog: boolean;
  showEditTeamMemberDialog: boolean;
  showDeleteTeamMemberDialog: boolean;
  selectedTeamMember: TeamMember | null;
  
  showAddPaymentMethodDialog: boolean;
  showEditPaymentMethodDialog: boolean;
  selectedPaymentMethod: PaymentMethod | null;
  showAccountNumbers: boolean;
  
  showPreviewDialog: boolean;
}

// Store Actions
interface SettingsActions {
  // Team member actions
  setTeamMembers: (members: TeamMember[]) => void;
  fetchTeamMembers: (storeId: string) => Promise<void>;
  addTeamMember: (storeId: string, memberData: any) => Promise<void>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  calculateRoleStats: () => void;
  
  // Activity log actions
  setActivityLogs: (logs: ActivityLog[]) => void;
  fetchActivityLogs: (storeId: string) => Promise<void>;
  
  // Payment method actions
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  fetchPaymentMethods: (storeId: string) => Promise<void>;
  addPaymentMethod: (storeId: string, methodData: any) => Promise<void>;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  
  // Store settings actions
  setStoreSettings: (settings: Partial<StoreSettings>) => void;
  updateStoreSettings: (storeId: string, settings: Partial<StoreSettings>) => Promise<void>;
  
  // Showcase settings actions
  setShowcaseSettings: (settings: Partial<ShowcaseSettings>) => void;
  loadShowcaseSettings: (storeId: string) => Promise<void>;
  saveShowcaseSettings: (storeId: string) => Promise<void>;
  toggleShowcase: (storeId: string, enabled: boolean) => Promise<void>;
  loadShowcaseAnalytics: (storeId: string) => Promise<void>;
  updateShowcaseTheme: (theme: Partial<ShowcaseTheme>) => void;
  resetShowcaseSettings: () => void;
  
  // Notification settings actions
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  
  // Privacy settings actions
  setPrivacySettings: (settings: Partial<PrivacySettings>) => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  
  // UI actions
  setCurrentTab: (tab: string) => void;
  setSelectedTeamMember: (member: TeamMember | null) => void;
  setSelectedPaymentMethod: (method: PaymentMethod | null) => void;
  setShowAddTeamMemberDialog: (show: boolean) => void;
  setShowEditTeamMemberDialog: (show: boolean) => void;
  setShowDeleteTeamMemberDialog: (show: boolean) => void;
  setShowAddPaymentMethodDialog: (show: boolean) => void;
  setShowEditPaymentMethodDialog: (show: boolean) => void;
  setShowAccountNumbers: (show: boolean) => void;
  setShowPreviewDialog: (show: boolean) => void;
  
  // Reset actions
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const initialStoreSettings: StoreSettings = {
  storeName: '',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  storeCurrency: 'MWK',
  storeTaxRate: '8.25',
};

const initialShowcaseSettings: ShowcaseSettings = {
  enableShowcase: false,
  showcaseSlug: '',
  showcaseDescription: '',
  showcaseLogoUrl: '',
  showcaseBannerUrl: '',
  seoTitle: '',
  seoDescription: '',
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    layout: 'grid'
  },
  contactInfo: {
    showPhone: true,
    showEmail: true,
    showAddress: true
  },
  analytics: {
    totalViews: 0,
    uniqueVisitors: 0,
    lastVisited: null,
    popularProducts: []
  }
};

const initialNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  lowStockAlerts: true,
  salesReports: true,
  systemUpdates: true,
};

const initialPrivacySettings: PrivacySettings = {
  analyticsEnabled: true,
  performanceTracking: true,
  usageTracking: true,
  errorTracking: true,
  geographicTracking: false,
};

const initialRoleStats: RoleStats = {
  owner: 0,
  manager: 0,
  cashier: 0,
  total: 0,
};

const initialState: SettingsState = {
  // Core data
  teamMembers: [],
  activityLogs: [],
  paymentMethods: [],
  loading: true,
  
  // Store settings
  storeSettings: initialStoreSettings,
  updatingStore: false,
  
  // Showcase settings
  showcaseSettings: initialShowcaseSettings,
  showcaseLoading: false,
  showcaseSaving: false,
  
  // Notification settings
  notificationSettings: initialNotificationSettings,
  
  // Privacy settings
  privacySettings: initialPrivacySettings,
  
  // UI state
  currentTab: 'team',
  roleStats: initialRoleStats,
  
  // Dialog states
  showAddTeamMemberDialog: false,
  showEditTeamMemberDialog: false,
  showDeleteTeamMemberDialog: false,
  selectedTeamMember: null,
  
  showAddPaymentMethodDialog: false,
  showEditPaymentMethodDialog: false,
  selectedPaymentMethod: null,
  showAccountNumbers: false,
  
  showPreviewDialog: false,
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Team member actions
        setTeamMembers: (members) => {
          set({ teamMembers: members }, false, 'setTeamMembers');
          get().calculateRoleStats();
        },

        fetchTeamMembers: async (storeId: string) => {
          try {
            set({ loading: true }, false, 'fetchTeamMembers:start');
            const { data, error } = await supabase
              .from('store_members')
              .select(`
                id,
                user_id,
                role,
                is_active,
                created_at,
                name,
                phone,
                email,
                pin
              `)
              .eq('store_id', storeId)
              .order('created_at', { ascending: false });

            if (error) {
              console.error('Error fetching team members:', error);
              toast.error('Failed to load team members');
              set({ loading: false }, false, 'fetchTeamMembers:error');
              return;
            }

            // Store members are already filtered to only show role-based members
            // (members with user_id = null are PIN-only roles, members with user_id are linked accounts)
            // We don't need to filter out the owner since they won't be in store_members table
            const roleMembers = data || [];

            set({
              teamMembers: roleMembers,
              loading: false
            }, false, 'fetchTeamMembers:success');

            get().calculateRoleStats();
          } catch (error) {
            console.error('Error fetching team members:', error);
            toast.error('Failed to load team members');
            set({ loading: false }, false, 'fetchTeamMembers:error');
          }
        },

        addTeamMember: async (storeId: string, memberData: any) => {
          try {
            // First, check if PIN is already in use in this store
            const { data: existingPin } = await supabase
              .from('store_members')
              .select('id')
              .eq('store_id', storeId)
              .eq('pin', memberData.pin)
              .maybeSingle();

            if (existingPin) {
              toast.error('This PIN is already in use. Please choose a different PIN.');
              return;
            }

            const { error } = await supabase
              .from('store_members')
              .insert({
                store_id: storeId,
                user_id: null, // No user account for roles
                role: memberData.role,
                name: memberData.name,
                phone: memberData.phone || null,
                email: memberData.email || null,
                pin: memberData.pin || null,
                is_active: memberData.is_active,
              });

            if (error) {
              toast.error('Failed to add team member');
              return;
            }

            toast.success('Team member added successfully');

            // Refresh team members
            get().fetchTeamMembers(storeId);
          } catch (error) {
            console.error('Error adding team member:', error);
            toast.error('Failed to add team member');
          }
        },

        updateTeamMember: async (id: string, updates: Partial<TeamMember>) => {
          try {
            const { error } = await supabase
              .from('store_members')
              .update(updates)
              .eq('id', id);

            if (error) {
              toast.error('Failed to update team member');
              return;
            }

            toast.success('Team member updated successfully');

            // Update local state
            const { teamMembers } = get();
            const updatedMembers = teamMembers.map(member =>
              member.id === id ? { ...member, ...updates } : member
            );
            get().setTeamMembers(updatedMembers);
          } catch (error) {
            console.error('Error updating team member:', error);
            toast.error('Failed to update team member');
          }
        },

        deleteTeamMember: async (id: string) => {
          try {
            const { error } = await supabase
              .from('store_members')
              .delete()
              .eq('id', id);

            if (error) {
              toast.error('Failed to delete team member');
              return;
            }

            toast.success('Team member deleted successfully');

            // Update local state
            const { teamMembers } = get();
            const updatedMembers = teamMembers.filter(member => member.id !== id);
            get().setTeamMembers(updatedMembers);
          } catch (error) {
            console.error('Error deleting team member:', error);
            toast.error('Failed to delete team member');
          }
        },

        calculateRoleStats: () => {
          const { teamMembers } = get();
          const activeMembers = teamMembers.filter(m => m.is_active);

          const newStats: RoleStats = {
            // Owner is the authenticated user (not in store_members table), so always count as 1
            owner: 1,
            manager: activeMembers.filter(m => m.role === 'manager').length,
            cashier: activeMembers.filter(m => m.role === 'cashier').length,
            // Total includes the owner + active members
            total: 1 + activeMembers.length,
          };

          set({ roleStats: newStats }, false, 'calculateRoleStats');
        },

        // Activity log actions
        setActivityLogs: (logs) => set({ activityLogs: logs }, false, 'setActivityLogs'),

        fetchActivityLogs: async (storeId: string) => {
          try {
            const { data, error } = await supabase
              .from('activity_logs')
              .select('*')
              .eq('store_id', storeId)
              .order('created_at', { ascending: false })
              .limit(100);

            if (error) {
              console.error('Error fetching activity logs:', error);
              toast.error('Failed to load activity logs');
              return;
            }

            set({ activityLogs: data || [] }, false, 'fetchActivityLogs:success');
          } catch (error) {
            console.error('Error fetching activity logs:', error);
            toast.error('Failed to load activity logs');
          }
        },

        // Payment method actions
        setPaymentMethods: (methods) => set({ paymentMethods: methods }, false, 'setPaymentMethods'),

        fetchPaymentMethods: async (storeId: string) => {
          try {
            const { data, error } = await supabase
              .from('payment_methods')
              .select('*')
              .eq('store_id', storeId)
              .order('name');

            if (error) {
              console.error('Error fetching payment methods:', error);
              toast.error('Failed to load payment methods');
              return;
            }

            set({ paymentMethods: data || [] }, false, 'fetchPaymentMethods:success');
          } catch (error) {
            console.error('Error fetching payment methods:', error);
            toast.error('Failed to load payment methods');
          }
        },

        addPaymentMethod: async (storeId: string, methodData: any) => {
          try {
            const { error } = await supabase
              .from('payment_methods')
              .insert({
                store_id: storeId,
                name: methodData.name,
                provider: methodData.provider,
                account_number: methodData.account_number,
                is_active: methodData.is_active,
                created_by: methodData.created_by,
              });

            if (error) {
              toast.error('Failed to add payment method');
              return;
            }

            toast.success('Payment method added successfully');

            // Refresh payment methods
            get().fetchPaymentMethods(storeId);
          } catch (error) {
            console.error('Error adding payment method:', error);
            toast.error('Failed to add payment method');
          }
        },

        updatePaymentMethod: async (id: string, updates: Partial<PaymentMethod>) => {
          try {
            const { error } = await supabase
              .from('payment_methods')
              .update(updates)
              .eq('id', id);

            if (error) {
              toast.error('Failed to update payment method');
              return;
            }

            toast.success('Payment method updated successfully');

            // Update local state
            const { paymentMethods } = get();
            const updatedMethods = paymentMethods.map(method =>
              method.id === id ? { ...method, ...updates } : method
            );
            set({ paymentMethods: updatedMethods }, false, 'updatePaymentMethod');
          } catch (error) {
            console.error('Error updating payment method:', error);
            toast.error('Failed to update payment method');
          }
        },

        deletePaymentMethod: async (id: string) => {
          try {
            const { error } = await supabase
              .from('payment_methods')
              .delete()
              .eq('id', id);

            if (error) {
              toast.error('Failed to delete payment method');
              return;
            }

            toast.success('Payment method deleted successfully');

            // Update local state
            const { paymentMethods } = get();
            const updatedMethods = paymentMethods.filter(method => method.id !== id);
            set({ paymentMethods: updatedMethods }, false, 'deletePaymentMethod');
          } catch (error) {
            console.error('Error deleting payment method:', error);
            toast.error('Failed to delete payment method');
          }
        },

        // Store settings actions
        setStoreSettings: (settings) => {
          const { storeSettings } = get();
          const updatedSettings = { ...storeSettings, ...settings };
          set({ storeSettings: updatedSettings }, false, 'setStoreSettings');
        },

        updateStoreSettings: async (storeId: string, settings: Partial<StoreSettings>) => {
          try {
            set({ updatingStore: true }, false, 'updateStoreSettings:start');

            const updateData: any = {};
            if (settings.storeName !== undefined) updateData.name = settings.storeName;
            if (settings.storeAddress !== undefined) updateData.address = settings.storeAddress;
            if (settings.storePhone !== undefined) updateData.phone = settings.storePhone;
            if (settings.storeEmail !== undefined) updateData.email = settings.storeEmail;
            if (settings.storeCurrency !== undefined) updateData.currency = settings.storeCurrency;
            if (settings.storeTaxRate !== undefined) updateData.tax_rate = parseFloat(settings.storeTaxRate);

            const { error } = await supabase
              .from('stores')
              .update(updateData)
              .eq('id', storeId);

            if (error) {
              toast.error('Failed to update store settings');
              return;
            }

            toast.success('Store settings updated successfully');

            // Update local state
            get().setStoreSettings(settings);
          } catch (error) {
            console.error('Error updating store settings:', error);
            toast.error('Failed to update store settings');
          } finally {
            set({ updatingStore: false }, false, 'updateStoreSettings:end');
          }
        },

        // Showcase settings actions
        setShowcaseSettings: (settings) => {
          const { showcaseSettings } = get();
          const updatedSettings = { ...showcaseSettings, ...settings };
          set({ showcaseSettings: updatedSettings }, false, 'setShowcaseSettings');
        },

        loadShowcaseSettings: async (storeId: string) => {
          try {
            set({ showcaseLoading: true }, false, 'loadShowcaseSettings:start');

            const { data, error } = await supabase
              .from('stores')
              .select(`
                enable_public_showcase,
                showcase_slug,
                showcase_theme,
                showcase_description,
                showcase_logo_url,
                showcase_banner_url,
                showcase_contact_info,
                showcase_seo_title,
                showcase_seo_description
              `)
              .eq('id', storeId)
              .single();

            if (error) {
              console.error('Error loading showcase settings:', error);
              toast.error('Failed to load showcase settings');
              return;
            }

            const settings: Partial<ShowcaseSettings> = {
              enableShowcase: data.enable_public_showcase || false,
              showcaseSlug: data.showcase_slug || '',
              showcaseDescription: data.showcase_description || '',
              showcaseLogoUrl: data.showcase_logo_url || '',
              showcaseBannerUrl: data.showcase_banner_url || '',
              seoTitle: data.showcase_seo_title || '',
              seoDescription: data.showcase_seo_description || '',
              theme: data.showcase_theme || initialShowcaseSettings.theme,
              contactInfo: data.showcase_contact_info || initialShowcaseSettings.contactInfo,
            };

            get().setShowcaseSettings(settings);
          } catch (error) {
            console.error('Error loading showcase settings:', error);
            toast.error('Failed to load showcase settings');
          } finally {
            set({ showcaseLoading: false }, false, 'loadShowcaseSettings:end');
          }
        },

        saveShowcaseSettings: async (storeId: string) => {
          try {
            set({ showcaseSaving: true }, false, 'saveShowcaseSettings:start');
            const { showcaseSettings } = get();

            const { error } = await supabase
              .from('stores')
              .update({
                showcase_slug: showcaseSettings.showcaseSlug.trim() || null,
                showcase_theme: showcaseSettings.theme,
                showcase_description: showcaseSettings.showcaseDescription.trim() || null,
                showcase_logo_url: showcaseSettings.showcaseLogoUrl.trim() || null,
                showcase_banner_url: showcaseSettings.showcaseBannerUrl.trim() || null,
                showcase_contact_info: showcaseSettings.contactInfo,
                showcase_seo_title: showcaseSettings.seoTitle.trim() || null,
                showcase_seo_description: showcaseSettings.seoDescription.trim() || null,
                updated_at: new Date().toISOString()
              })
              .eq('id', storeId);

            if (error) {
              toast.error('Failed to save showcase settings');
              return;
            }

            toast.success('Showcase settings saved successfully');
          } catch (error) {
            console.error('Error saving showcase settings:', error);
            toast.error('Failed to save showcase settings');
          } finally {
            set({ showcaseSaving: false }, false, 'saveShowcaseSettings:end');
          }
        },

        toggleShowcase: async (storeId: string, enabled: boolean) => {
          try {
            const { error } = await supabase
              .from('stores')
              .update({
                enable_public_showcase: enabled,
                updated_at: new Date().toISOString()
              })
              .eq('id', storeId);

            if (error) {
              toast.error(`Failed to ${enabled ? 'enable' : 'disable'} showcase`);
              return;
            }

            toast.success(`Showcase ${enabled ? 'enabled' : 'disabled'} successfully`);

            // Update local state
            get().setShowcaseSettings({ enableShowcase: enabled });
          } catch (error) {
            console.error('Error toggling showcase:', error);
            toast.error(`Failed to ${enabled ? 'enable' : 'disable'} showcase`);
          }
        },

        loadShowcaseAnalytics: async (storeId: string) => {
          try {
            // This would connect to analytics service in production
            // For now, simulate analytics data
            const mockAnalytics: ShowcaseAnalytics = {
              totalViews: Math.floor(Math.random() * 1000) + 100,
              uniqueVisitors: Math.floor(Math.random() * 500) + 50,
              lastVisited: new Date().toISOString(),
              popularProducts: [
                { id: '1', name: 'Popular Product 1', views: 45 },
                { id: '2', name: 'Popular Product 2', views: 32 },
                { id: '3', name: 'Popular Product 3', views: 28 }
              ]
            };

            get().setShowcaseSettings({ analytics: mockAnalytics });
          } catch (error) {
            console.error('Error loading showcase analytics:', error);
          }
        },

        updateShowcaseTheme: (theme: Partial<ShowcaseTheme>) => {
          const { showcaseSettings } = get();
          const updatedTheme = { ...showcaseSettings.theme, ...theme };
          get().setShowcaseSettings({ theme: updatedTheme });
        },

        resetShowcaseSettings: () => {
          set({ showcaseSettings: initialShowcaseSettings }, false, 'resetShowcaseSettings');
        },

        // Notification settings actions
        setNotificationSettings: (settings) => {
          const { notificationSettings } = get();
          const updatedSettings = { ...notificationSettings, ...settings };
          set({ notificationSettings: updatedSettings }, false, 'setNotificationSettings');
        },

        updateNotificationSettings: async (settings: Partial<NotificationSettings>) => {
          try {
            // For now, just update local state and localStorage
            // In the future, this could sync with a backend service
            get().setNotificationSettings(settings);

            const { notificationSettings } = get();
            localStorage.setItem('storefy_notification_settings', JSON.stringify(notificationSettings));

            toast.success('Notification settings updated');
          } catch (error) {
            console.error('Error updating notification settings:', error);
            toast.error('Failed to update notification settings');
          }
        },

        // Privacy settings actions
        setPrivacySettings: (settings) => {
          const { privacySettings } = get();
          const updatedSettings = { ...privacySettings, ...settings };
          set({ privacySettings: updatedSettings }, false, 'setPrivacySettings');
        },

        updatePrivacySettings: (settings: Partial<PrivacySettings>) => {
          try {
            get().setPrivacySettings(settings);

            const { privacySettings } = get();
            localStorage.setItem('storefy_privacy_settings', JSON.stringify(privacySettings));

            toast.success('Privacy settings updated');
          } catch (error) {
            console.error('Error updating privacy settings:', error);
            toast.error('Failed to update privacy settings');
          }
        },

        // UI actions
        setCurrentTab: (tab) => set({ currentTab: tab }, false, 'setCurrentTab'),
        setSelectedTeamMember: (member) => set({ selectedTeamMember: member }, false, 'setSelectedTeamMember'),
        setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }, false, 'setSelectedPaymentMethod'),
        setShowAddTeamMemberDialog: (show) => set({ showAddTeamMemberDialog: show }, false, 'setShowAddTeamMemberDialog'),
        setShowEditTeamMemberDialog: (show) => set({ showEditTeamMemberDialog: show }, false, 'setShowEditTeamMemberDialog'),
        setShowDeleteTeamMemberDialog: (show) => set({ showDeleteTeamMemberDialog: show }, false, 'setShowDeleteTeamMemberDialog'),
        setShowAddPaymentMethodDialog: (show) => set({ showAddPaymentMethodDialog: show }, false, 'setShowAddPaymentMethodDialog'),
        setShowEditPaymentMethodDialog: (show) => set({ showEditPaymentMethodDialog: show }, false, 'setShowEditPaymentMethodDialog'),
        setShowAccountNumbers: (show) => set({ showAccountNumbers: show }, false, 'setShowAccountNumbers'),
        setShowPreviewDialog: (show) => set({ showPreviewDialog: show }, false, 'setShowPreviewDialog'),

        // Reset actions
        resetSettings: () => set(initialState, false, 'resetSettings'),
      }),
      {
        name: 'settings-store',
        partialize: (state) => ({
          // Only persist UI preferences and local settings
          currentTab: state.currentTab,
          showAccountNumbers: state.showAccountNumbers,
          notificationSettings: state.notificationSettings,
          privacySettings: state.privacySettings,
        }),
      }
    ),
    { name: 'settings-store' }
  )
);

// Simple individual selectors - no object returns to avoid infinite loops
export const useTeamMembers = () => useSettingsStore((state) => state.teamMembers);
export const useActivityLogs = () => useSettingsStore((state) => state.activityLogs);
export const usePaymentMethods = () => useSettingsStore((state) => state.paymentMethods);
export const useRoleStats = () => useSettingsStore((state) => state.roleStats);
export const useStoreSettings = () => useSettingsStore((state) => state.storeSettings);
export const useShowcaseSettings = () => useSettingsStore((state) => state.showcaseSettings);
export const useShowcaseTheme = () => useSettingsStore((state) => state.showcaseSettings.theme);
export const useShowcaseAnalytics = () => useSettingsStore((state) => state.showcaseSettings.analytics);
export const useShowcaseLoading = () => useSettingsStore((state) => state.showcaseLoading);
export const useShowcaseSaving = () => useSettingsStore((state) => state.showcaseSaving);
export const useNotificationSettings = () => useSettingsStore((state) => state.notificationSettings);
export const usePrivacySettings = () => useSettingsStore((state) => state.privacySettings);
