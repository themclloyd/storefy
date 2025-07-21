import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { clearTaxCache, percentageToDecimal, isValidTaxRate } from '@/lib/taxUtils';

// Types
export interface StoreConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxRate: string; // Stored as string for form handling, converted to decimal for DB
  timezone: string;
  businessHours: {
    open: string;
    close: string;
    days: string[];
  };
  features: {
    enableLayby: boolean;
    enableShowcase: boolean;
    enableInventoryTracking: boolean;
    enableCustomerAccounts: boolean;
  };
}

interface StoreConfigState {
  config: StoreConfig;
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSaved: string | null;
}

interface StoreConfigActions {
  // Data actions
  setConfig: (config: Partial<StoreConfig>) => void;
  loadConfig: (storeId: string) => Promise<void>;
  saveConfig: (storeId: string) => Promise<void>;
  
  // Feature toggles
  toggleFeature: (feature: keyof StoreConfig['features'], enabled: boolean) => void;
  
  // Business hours
  setBusinessHours: (hours: Partial<StoreConfig['businessHours']>) => void;
  
  // State management
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

type StoreConfigStore = StoreConfigState & StoreConfigActions;

const initialConfig: StoreConfig = {
  name: '',
  address: '',
  phone: '',
  email: '',
  currency: 'MWK',
  taxRate: '8.25',
  timezone: 'Africa/Blantyre',
  businessHours: {
    open: '08:00',
    close: '18:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  },
  features: {
    enableLayby: true,
    enableShowcase: false,
    enableInventoryTracking: true,
    enableCustomerAccounts: true,
  },
};

const initialState: StoreConfigState = {
  config: initialConfig,
  loading: false,
  saving: false,
  error: null,
  lastSaved: null,
};

export const useStoreConfigStore = create<StoreConfigStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Data actions
      setConfig: (updates) => {
        set(
          state => ({
            config: { ...state.config, ...updates },
            error: null,
          }),
          false,
          'storeConfig/setConfig'
        );
      },

      loadConfig: async (storeId: string) => {
        try {
          set({ loading: true, error: null }, false, 'storeConfig/loadConfig:start');

          const { data, error } = await supabase
            .from('stores')
            .select(`
              name,
              address,
              phone,
              email,
              currency,
              tax_rate,
              timezone,
              business_hours,
              features
            `)
            .eq('id', storeId)
            .single();

          if (error) throw error;

          if (data) {
            const config: StoreConfig = {
              name: data.name || '',
              address: data.address || '',
              phone: data.phone || '',
              email: data.email || '',
              currency: data.currency || 'MWK',
              taxRate: data.tax_rate?.toString() || '8.25',
              timezone: data.timezone || 'Africa/Blantyre',
              businessHours: data.business_hours || initialConfig.businessHours,
              features: data.features || initialConfig.features,
            };

            set({
              config,
              loading: false,
              error: null,
            }, false, 'storeConfig/loadConfig:success');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load store configuration';
          console.error('Error loading store config:', error);
          set({
            loading: false,
            error: errorMessage,
          }, false, 'storeConfig/loadConfig:error');
        }
      },

      saveConfig: async (storeId: string) => {
        try {
          const { config } = get();
          
          // Validate required fields
          if (!config.name.trim()) {
            throw new Error('Store name is required');
          }

          // Validate tax rate
          const taxRateDecimal = percentageToDecimal(parseFloat(config.taxRate));
          if (isNaN(taxRateDecimal) || !isValidTaxRate(taxRateDecimal)) {
            throw new Error('Tax rate must be a valid percentage between 0 and 100');
          }

          // Validate email if provided
          if (config.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email.trim())) {
            throw new Error('Please enter a valid email address');
          }

          set({ saving: true, error: null }, false, 'storeConfig/saveConfig:start');

          const { error } = await supabase
            .from('stores')
            .update({
              name: config.name.trim(),
              address: config.address.trim() || null,
              phone: config.phone.trim() || null,
              email: config.email.trim() || null,
              currency: config.currency,
              tax_rate: taxRateDecimal,
              timezone: config.timezone,
              business_hours: config.businessHours,
              features: config.features,
              updated_at: new Date().toISOString(),
            })
            .eq('id', storeId);

          if (error) throw error;

          // Clear tax cache since tax rate might have changed
          clearTaxCache();

          set({
            saving: false,
            error: null,
            lastSaved: new Date().toISOString(),
          }, false, 'storeConfig/saveConfig:success');

          toast.success('Store settings saved successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to save store configuration';
          console.error('Error saving store config:', error);
          toast.error(errorMessage);
          set({
            saving: false,
            error: errorMessage,
          }, false, 'storeConfig/saveConfig:error');
        }
      },

      // Feature toggles
      toggleFeature: (feature, enabled) => {
        set(
          state => ({
            config: {
              ...state.config,
              features: {
                ...state.config.features,
                [feature]: enabled,
              },
            },
          }),
          false,
          `storeConfig/toggleFeature:${feature}`
        );
      },

      // Business hours
      setBusinessHours: (hours) => {
        set(
          state => ({
            config: {
              ...state.config,
              businessHours: {
                ...state.config.businessHours,
                ...hours,
              },
            },
          }),
          false,
          'storeConfig/setBusinessHours'
        );
      },

      // State management
      setLoading: (loading) => set({ loading }, false, 'storeConfig/setLoading'),
      setSaving: (saving) => set({ saving }, false, 'storeConfig/setSaving'),
      setError: (error) => set({ error }, false, 'storeConfig/setError'),
      reset: () => set(initialState, false, 'storeConfig/reset'),
    }),
    { name: 'store-config-store' }
  )
);

// Selectors
export const useStoreConfig = () => useStoreConfigStore(state => state.config);
export const useStoreConfigLoading = () => useStoreConfigStore(state => state.loading);
export const useStoreConfigSaving = () => useStoreConfigStore(state => state.saving);
export const useStoreConfigError = () => useStoreConfigStore(state => state.error);
export const useStoreConfigLastSaved = () => useStoreConfigStore(state => state.lastSaved);

// Feature selectors
export const useStoreFeatures = () => useStoreConfigStore(state => state.config.features);
export const useStoreFeature = (feature: keyof StoreConfig['features']) => 
  useStoreConfigStore(state => state.config.features[feature]);

// Business hours selectors
export const useBusinessHours = () => useStoreConfigStore(state => state.config.businessHours);

// Actions
export const useStoreConfigActions = () => useStoreConfigStore(state => ({
  setConfig: state.setConfig,
  loadConfig: state.loadConfig,
  saveConfig: state.saveConfig,
  toggleFeature: state.toggleFeature,
  setBusinessHours: state.setBusinessHours,
  setLoading: state.setLoading,
  setSaving: state.setSaving,
  setError: state.setError,
  reset: state.reset,
}));
