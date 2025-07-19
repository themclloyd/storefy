import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from './authStore';
import { useStoreStore } from './storeStore';

// Permission types (copied from PermissionContext)
export type Permission = 
  | 'view_dashboard'
  | 'manage_inventory'
  | 'view_inventory'
  | 'add_product'
  | 'edit_product'
  | 'delete_product'
  | 'adjust_stock'
  | 'manage_categories'
  | 'manage_suppliers'
  | 'process_sales'
  | 'view_sales'
  | 'manage_customers'
  | 'view_customers'
  | 'manage_layby'
  | 'view_layby'
  | 'view_transactions'
  | 'manage_transactions'
  | 'view_reports'
  | 'generate_reports'
  | 'manage_expenses'
  | 'view_expenses'
  | 'view_analytics'
  | 'manage_settings'
  | 'manage_users'
  | 'manage_store'
  | 'system_admin';

export type ProtectedPage = 
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'categories'
  | 'suppliers'
  | 'customers'
  | 'layby'
  | 'transactions'
  | 'reports'
  | 'expenses'
  | 'analytics'
  | 'settings'
  | 'showcase';

interface PermissionState {
  userRole: string | null;
  permissions: Set<Permission>;
  pageAccess: Set<ProtectedPage>;
  loading: boolean;
  initialized: boolean;
}

interface PermissionActions {
  loadPermissions: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  canAccessPage: (page: ProtectedPage) => boolean;
  checkPermission: (permission: Permission) => Promise<boolean>;
  checkPageAccess: (page: ProtectedPage) => Promise<boolean>;
  refreshPermissions: () => Promise<void>;
  logSecurityEvent: (event: string, details?: any) => void;
  reset: () => void;
}

type PermissionStore = PermissionState & PermissionActions;

const initialState: PermissionState = {
  userRole: null,
  permissions: new Set(),
  pageAccess: new Set(),
  loading: false,
  initialized: false,
};

export const usePermissionStore = create<PermissionStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadPermissions: async () => {
        const state = get();
        if (state.loading) return;

        console.log('🔐 Loading permissions...');
        set({ loading: true }, false, 'loadPermissions:start');

        try {
          const user = useAuthStore.getState().user;
          const currentStore = useStoreStore.getState().currentStore;

          console.log('🔐 Loading permissions for user:', user?.email, 'store:', currentStore?.name);

          if (!user) {
            console.log('🔐 No user found, setting no permissions');
            set({
              userRole: null,
              permissions: new Set(),
              pageAccess: new Set(),
              loading: false,
              initialized: true,
            }, false, 'loadPermissions:noUser');
            return;
          }

          if (!currentStore || !currentStore.id) {
            console.log('🔐 No store selected, setting basic permissions for all pages');
            console.log('🔐 Store object:', currentStore);
            // Set basic permissions for when no store is selected - allow access to all pages
            // This is a temporary fix until store selection is working properly
            const basicPages: ProtectedPage[] = [
              'dashboard', 'pos', 'inventory', 'customers', 'layby',
              'transactions', 'expenses', 'analytics', 'showcase'
            ];
            const basicPageAccess = new Set<ProtectedPage>(basicPages);

            set({
              userRole: 'owner', // Temporary: assume owner when no store selected
              permissions: new Set(),
              pageAccess: basicPageAccess,
              loading: false,
              initialized: true,
            }, false, 'loadPermissions:noStore');
            console.log('🔐 Set basic permissions for pages:', Array.from(basicPageAccess));
            return;
          }

          // Use the proper RPC function to get user role and ownership (like the working version)
          console.log('🔐 Fetching user effective role...');
          const { data: dbRoleData, error: roleError } = await supabase
            .rpc('get_user_effective_role', {
              _store_id: currentStore.id
            });

          if (roleError || !dbRoleData?.[0]) {
            console.log('🔐 No role data found for user in store');
            set({
              userRole: null,
              permissions: new Set(),
              pageAccess: new Set(),
              loading: false,
              initialized: true,
            }, false, 'loadPermissions:noRole');
            return;
          }

          const userData = dbRoleData[0];
          const isOwner = userData.is_owner;
          const roleData = { role: userData.role };

          console.log('🔐 RPC result - Role:', userData.role, 'Is owner:', isOwner);



          // Determine user role - store owners get owner role, others get their assigned role
          const userRole = isOwner ? 'owner' : (roleData?.role || 'cashier');
          console.log('🔐 User role determined:', userRole, isOwner ? '(store owner)' : '(from store_members)');
          const newPermissions = new Set<Permission>();
          const newPageAccess = new Set<ProtectedPage>();

          // Define permissions based on role
          const ownerPermissions: Permission[] = [
            'view_dashboard', 'manage_inventory', 'view_inventory', 'add_product', 'edit_product', 
            'delete_product', 'adjust_stock', 'manage_categories', 'manage_suppliers', 'process_sales', 
            'view_sales', 'manage_customers', 'view_customers', 'manage_layby', 'view_layby', 
            'view_transactions', 'manage_transactions', 'view_reports', 'generate_reports', 
            'manage_expenses', 'view_expenses', 'view_analytics', 'manage_settings', 'manage_users', 
            'manage_store'
          ];

          const managerPermissions: Permission[] = [
            'view_dashboard', 'manage_inventory', 'view_inventory', 'add_product', 'edit_product', 
            'delete_product', 'adjust_stock', 'manage_categories', 'manage_suppliers', 'process_sales', 
            'view_sales', 'manage_customers', 'view_customers', 'manage_layby', 'view_layby', 
            'view_transactions', 'view_reports', 'generate_reports', 'manage_expenses', 'view_expenses', 
            'view_analytics'
          ];

          const cashierPermissions: Permission[] = [
            'view_dashboard', 'view_inventory', 'process_sales', 'view_sales', 'view_customers', 
            'manage_layby', 'view_layby', 'view_transactions'
          ];

          // Define page access based on role
          const ownerPages: ProtectedPage[] = [
            'dashboard', 'pos', 'inventory', 'categories', 'suppliers', 'customers', 'layby', 
            'transactions', 'reports', 'expenses', 'analytics', 'settings', 'showcase'
          ];

          const managerPages: ProtectedPage[] = [
            'dashboard', 'pos', 'inventory', 'categories', 'suppliers', 'customers', 'layby', 
            'transactions', 'reports', 'expenses', 'analytics'
          ];

          const cashierPages: ProtectedPage[] = [
            'dashboard', 'pos', 'customers', 'layby', 'transactions'
          ];

          // Apply permissions based on role
          if (userRole === 'owner') {
            ownerPermissions.forEach(p => newPermissions.add(p));
            ownerPages.forEach(p => newPageAccess.add(p));
            console.log('🔐 Applied owner permissions. Pages:', Array.from(newPageAccess));
          } else if (userRole === 'manager') {
            managerPermissions.forEach(p => newPermissions.add(p));
            managerPages.forEach(p => newPageAccess.add(p));
            console.log('🔐 Applied manager permissions. Pages:', Array.from(newPageAccess));
          } else {
            cashierPermissions.forEach(p => newPermissions.add(p));
            cashierPages.forEach(p => newPageAccess.add(p));
            console.log('🔐 Applied cashier permissions. Pages:', Array.from(newPageAccess));
          }

          set({
            userRole,
            permissions: newPermissions,
            pageAccess: newPageAccess,
            loading: false,
            initialized: true,
          }, false, 'loadPermissions:success');

          // Update store store with the correct ownership info
          const storeState = useStoreStore.getState();
          if (storeState.currentStore) {
            console.log('🔐 Updating store state with ownership info - isOwner:', isOwner, 'userRole:', userRole);
            useStoreStore.getState().setCurrentStore({
              ...storeState.currentStore,
              // Ensure the store has the owner_id for future checks
              owner_id: storeState.currentStore.owner_id || (isOwner ? user.id : storeState.currentStore.owner_id)
            });
          }

        } catch (error) {
          console.error('Error loading permissions:', error);
          set({
            userRole: null,
            permissions: new Set(),
            pageAccess: new Set(),
            loading: false,
            initialized: true,
          }, false, 'loadPermissions:error');
        }
      },

      hasPermission: (permission: Permission): boolean => {
        return get().permissions.has(permission);
      },

      canAccessPage: (page: ProtectedPage): boolean => {
        return get().pageAccess.has(page);
      },

      checkPermission: async (permission: Permission): Promise<boolean> => {
        const currentStore = useStoreStore.getState().currentStore;
        if (!currentStore) return false;

        try {
          const { data, error } = await supabase
            .rpc('check_user_permission', {
              _store_id: currentStore.id,
              _action: permission
            });

          return !error && data === true;
        } catch (error) {
          return false;
        }
      },

      checkPageAccess: async (page: ProtectedPage): Promise<boolean> => {
        // For now, use local permissions. Could be enhanced with server-side checks
        return get().canAccessPage(page);
      },

      refreshPermissions: async () => {
        await get().loadPermissions();
      },

      logSecurityEvent: (event: string, details?: any) => {
        console.log('🔒 Security Event:', event, details);
        // Could be enhanced to send to analytics or logging service
      },

      reset: () => {
        set(initialState, false, 'reset');
      },
    }),
    {
      name: 'permission-store',
    }
  )
);

// Selectors for optimized re-renders
export const useUserRole = () => usePermissionStore((state) => state.userRole);
export const usePermissionLoading = () => usePermissionStore((state) => state.loading);
export const usePermissionInitialized = () => usePermissionStore((state) => state.initialized);
export const useHasPermission = () => usePermissionStore((state) => state.hasPermission);
export const useCanAccessPage = () => usePermissionStore((state) => state.canAccessPage);
// Individual action selectors to avoid object recreation
export const useLoadPermissions = () => usePermissionStore((state) => state.loadPermissions);
export const useCheckPermission = () => usePermissionStore((state) => state.checkPermission);
export const useCheckPageAccess = () => usePermissionStore((state) => state.checkPageAccess);
export const useRefreshPermissions = () => usePermissionStore((state) => state.refreshPermissions);
export const useLogSecurityEvent = () => usePermissionStore((state) => state.logSecurityEvent);
export const useResetPermissions = () => usePermissionStore((state) => state.reset);

// Combined hook for backward compatibility
export const usePermissions = () => {
  const userRole = useUserRole();
  const loading = usePermissionLoading();
  const hasPermission = useHasPermission();
  const canAccessPage = useCanAccessPage();
  const loadPermissions = useLoadPermissions();
  const checkPermission = useCheckPermission();
  const refreshPermissions = useRefreshPermissions();

  return {
    userRole,
    loading,
    hasPermission,
    canAccessPage,
    loadPermissions,
    checkPermission,
    refreshPermissions,
  };
};

// Note: Store change subscription removed to prevent premature permission loading
// Permissions are now loaded only through the initialization hook after proper timing
