import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useStore } from './StoreContext';
import { toast } from 'sonner';

// Define all possible permissions
export type Permission = 
  | 'view_dashboard'
  | 'process_transaction'
  | 'view_products'
  | 'manage_inventory'
  | 'view_customers'
  | 'manage_customers'
  | 'create_customer'
  | 'update_customer_basic'
  | 'view_layby'
  | 'process_layby_payment'
  | 'manage_layby'
  | 'view_inventory_basic'
  | 'view_reports_basic'
  | 'view_reports_advanced'
  | 'manage_categories'
  | 'manage_suppliers'
  | 'manage_expenses'
  | 'create_expense'
  | 'manage_settings'
  | 'manage_team'
  | 'delete_store'
  | 'change_ownership'
  | 'manage_billing'
  | 'export_all_data';

// Define pages that require permission checks
export type ProtectedPage = 
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'products'
  | 'categories'
  | 'suppliers'
  | 'customers'
  | 'transactions'
  | 'layby'
  | 'reports'
  | 'expenses'
  | 'settings';

interface UserRole {
  role: 'owner' | 'manager' | 'cashier';
  isOwner: boolean;
  memberId?: string;
  memberName?: string;
}

interface PermissionContextType {
  userRole: UserRole | null;
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  canAccessPage: (page: ProtectedPage) => boolean;
  checkPermission: (permission: Permission) => Promise<boolean>;
  checkPageAccess: (page: ProtectedPage) => Promise<boolean>;
  refreshPermissions: () => Promise<void>;
  logSecurityEvent: (eventType: string, details?: any) => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentStore } = useStore();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());
  const [pageAccess, setPageAccess] = useState<Set<ProtectedPage>>(new Set());

  // Check for PIN session
  const pinSession = localStorage.getItem('pin_session');
  const pinData = pinSession ? JSON.parse(pinSession) : null;

  useEffect(() => {
    if (currentStore) {
      loadUserPermissions();
    } else {
      setLoading(false);
    }
  }, [currentStore?.id, user?.id]); // Only re-run when IDs change, not full objects

  // Listen for PIN session changes
  useEffect(() => {
    const handlePinSessionChange = () => {
      // Reload permissions when PIN session changes
      if (currentStore) {
        loadUserPermissions();
      }
    };

    window.addEventListener('pin-session-changed', handlePinSessionChange);
    return () => window.removeEventListener('pin-session-changed', handlePinSessionChange);
  }, [currentStore]);

  const loadUserPermissions = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      let roleData: any = null;

      // For PIN sessions, use cached role data (faster)
      if (pinData) {
        // Trust PIN session data for speed (already validated on login)
        roleData = {
          role: pinData.role,
          isOwner: pinData.role === 'owner',
          memberId: pinData.member_id,
          memberName: pinData.name
        };
      } else {
        // Regular user session, get role from database
        const { data: dbRoleData, error } = await supabase
          .rpc('get_user_effective_role', {
            _store_id: currentStore.id
          });

        if (error || !dbRoleData?.[0]) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        const userData = dbRoleData[0];
        roleData = {
          role: userData.role,
          isOwner: userData.is_owner,
          memberId: userData.member_id,
          memberName: userData.member_name
        };
      }

      setUserRole(roleData);

      // Load permissions based on role (client-side for speed)
      loadPermissionsFromRole(roleData.role, roleData.isOwner);

    } catch (error) {
      // Don't show error toast for better UX in POS
      // Use fallback permissions for graceful degradation
      setUserRole({ role: 'cashier', isOwner: false, memberId: null, memberName: 'Unknown' });
      loadPermissionsFromRole('cashier', false);
    } finally {
      setLoading(false);
    }
  };

  // Fast client-side permission loading based on role
  const loadPermissionsFromRole = (role: 'owner' | 'manager' | 'cashier', isOwner: boolean) => {
    const newPermissions = new Set<Permission>();
    const newPageAccess = new Set<ProtectedPage>();

    // Owner permissions (all)
    if (isOwner || role === 'owner') {
      // All permissions
      const allPermissions: Permission[] = [
        'view_dashboard', 'process_transaction', 'view_products', 'manage_inventory',
        'view_customers', 'manage_customers', 'create_customer', 'update_customer_basic',
        'view_layby', 'process_layby_payment', 'manage_layby', 'view_inventory_basic',
        'view_reports_basic', 'view_reports_advanced', 'manage_categories', 'manage_suppliers',
        'manage_expenses', 'manage_settings', 'manage_team', 'delete_store',
        'change_ownership', 'manage_billing', 'export_all_data'
      ];
      allPermissions.forEach(p => newPermissions.add(p));

      // All pages
      const allPages: ProtectedPage[] = [
        'dashboard', 'pos', 'inventory', 'products', 'categories', 'suppliers',
        'customers', 'transactions', 'layby', 'reports', 'expenses', 'settings'
      ];
      allPages.forEach(p => newPageAccess.add(p));
    }
    // Manager permissions
    else if (role === 'manager') {
      const managerPermissions: Permission[] = [
        'view_dashboard', 'process_transaction', 'view_products', 'manage_inventory',
        'view_customers', 'manage_customers', 'create_customer', 'update_customer_basic',
        'view_layby', 'process_layby_payment', 'manage_layby', 'view_inventory_basic',
        'view_reports_basic', 'view_reports_advanced', 'manage_categories', 'manage_suppliers',
        'manage_expenses', 'manage_team'
      ];
      managerPermissions.forEach(p => newPermissions.add(p));

      const managerPages: ProtectedPage[] = [
        'dashboard', 'pos', 'inventory', 'products', 'categories', 'suppliers',
        'customers', 'transactions', 'layby', 'reports', 'expenses'
      ];
      managerPages.forEach(p => newPageAccess.add(p));
    }
    // Cashier permissions (very limited - view only for most things)
    else {
      const cashierPermissions: Permission[] = [
        'view_dashboard', 'process_transaction', 'view_products', 'view_customers',
        'create_customer', 'update_customer_basic', 'view_layby', 'process_layby_payment',
        'view_inventory_basic', 'view_reports_basic', 'create_expense'
        // Removed: 'manage_customers', 'manage_inventory', 'manage_expenses' - cashiers cannot delete or manage
        // Added: 'create_expense' - cashiers can record expenses but not modify/delete them
      ];
      cashierPermissions.forEach(p => newPermissions.add(p));

      const cashierPages: ProtectedPage[] = [
        'dashboard', 'pos', 'inventory', 'customers', 'transactions', 'layby', 'expenses'
      ];
      cashierPages.forEach(p => newPageAccess.add(p));
    }

    setPermissions(newPermissions);
    setPageAccess(newPageAccess);
  };

  const hasPermission = (permission: Permission): boolean => {
    return permissions.has(permission);
  };

  const canAccessPage = (page: ProtectedPage): boolean => {
    return pageAccess.has(page);
  };

  const checkPermission = async (permission: Permission): Promise<boolean> => {
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
  };

  const checkPageAccess = async (page: ProtectedPage): Promise<boolean> => {
    if (!currentStore) return false;

    try {
      const { data, error } = await supabase
        .rpc('can_access_page', {
          _store_id: currentStore.id,
          _page: page
        });

      return !error && data === true;
    } catch (error) {
      return false;
    }
  };

  const refreshPermissions = async () => {
    await loadUserPermissions();
  };

  const logSecurityEvent = async (eventType: string, details: any = {}) => {
    if (!currentStore || !user) return;

    try {
      await supabase.rpc('log_security_event', {
        _store_id: currentStore.id,
        _event_type: eventType,
        _details: details
      });
    } catch (error) {
      // Silently fail security logging to avoid disrupting user experience
      // Security is still maintained through RLS policies
    }
  };

  const value = {
    userRole,
    loading,
    hasPermission,
    canAccessPage,
    checkPermission,
    checkPageAccess,
    refreshPermissions,
    logSecurityEvent,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
