import { usePermissions, Permission, ProtectedPage } from '@/stores/permissionStore';
import { useCurrentStore } from '@/stores/storeStore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  ShoppingCartIcon,
  CubeIcon,
  UsersIcon,
  ReceiptPercentIcon,
  ClockIcon,
  CreditCardIcon,
  CogIcon,
  GlobeAltIcon
} from '@heroicons/react/24/solid';

/**
 * Hook for checking if user has specific permission
 */
export function usePermission(permission: Permission) {
  const { hasPermission, loading } = usePermissions();
  
  return {
    hasPermission: hasPermission(permission),
    loading
  };
}

/**
 * Hook for checking if user can access a specific page
 */
export function usePageAccess(page: ProtectedPage) {
  const { canAccessPage, loading, logSecurityEvent } = usePermissions();
  const navigate = useNavigate();
  const currentStore = useCurrentStore();

  const canAccess = canAccessPage(page);

  useEffect(() => {
    if (!loading && !canAccess && currentStore) {
      // Log unauthorized access attempt
      logSecurityEvent('unauthorized_page_access', {
        attempted_page: page,
        store_id: currentStore.id,
        timestamp: new Date().toISOString()
      });

      // Redirect to dashboard or show error
      navigate('/dashboard', { replace: true });
    }
  }, [loading, canAccess, page, currentStore, navigate, logSecurityEvent]);

  return {
    canAccess,
    loading
  };
}

/**
 * Hook for role-based component rendering
 */
export function useRoleBasedRendering() {
  const { userRole, hasPermission, canAccessPage } = usePermissions();
  
  const renderIfPermission = (permission: Permission, component: React.ReactNode) => {
    return hasPermission(permission) ? component : null;
  };
  
  const renderIfRole = (allowedRoles: Array<'owner' | 'manager' | 'cashier'>, component: React.ReactNode) => {
    return userRole && allowedRoles.includes(userRole.role) ? component : null;
  };
  
  const renderIfPageAccess = (page: ProtectedPage, component: React.ReactNode) => {
    return canAccessPage(page) ? component : null;
  };
  
  const renderIfOwner = (component: React.ReactNode) => {
    return userRole?.isOwner ? component : null;
  };
  
  const renderIfManager = (component: React.ReactNode) => {
    return userRole && ['owner', 'manager'].includes(userRole.role) ? component : null;
  };
  
  return {
    userRole,
    renderIfPermission,
    renderIfRole,
    renderIfPageAccess,
    renderIfOwner,
    renderIfManager
  };
}

/**
 * Hook for secure action execution with permission checking
 */
export function useSecureAction() {
  const { checkPermission, logSecurityEvent } = usePermissions();
  const currentStore = useCurrentStore();
  
  const executeWithPermission = async (
    permission: Permission,
    action: () => Promise<void> | void,
    onUnauthorized?: () => void
  ) => {
    const hasPermission = await checkPermission(permission);
    
    if (!hasPermission) {
      // Log unauthorized action attempt
      await logSecurityEvent('unauthorized_action_attempt', {
        attempted_action: permission,
        store_id: currentStore?.id,
        timestamp: new Date().toISOString()
      });
      
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        throw new Error(`Unauthorized: Missing permission ${permission}`);
      }
      return;
    }
    
    // Log successful action
    await logSecurityEvent('authorized_action', {
      action: permission,
      store_id: currentStore?.id,
      timestamp: new Date().toISOString()
    });
    
    await action();
  };
  
  return { executeWithPermission };
}

/**
 * Hook for route protection
 */
export function useRouteProtection(requiredPage: ProtectedPage) {
  const { canAccessPage, loading, userRole } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (!loading) {
      setIsAuthorized(canAccessPage(requiredPage));
    }
  }, [loading, canAccessPage, requiredPage]);
  
  return {
    isAuthorized,
    loading,
    userRole
  };
}

/**
 * Hook for getting role-specific navigation items
 */
export function useRoleBasedNavigation() {
  const { userRole, canAccessPage } = usePermissions();
  
  const getAvailablePages = (): ProtectedPage[] => {
    const allPages: ProtectedPage[] = [
      'dashboard', 'pos', 'inventory', 'customers', 'transactions', 'layby', 'expenses', 'settings', 'showcase'
    ];

    return allPages.filter(page => canAccessPage(page));
  };
  
  const getNavigationItems = () => {
    const availablePages = getAvailablePages();

    console.log('🔧 Navigation - User role:', userRole, 'Available pages:', availablePages);

    const navigationMap = {
      dashboard: { label: 'Overview', icon: ChartBarIcon },
      pos: { label: 'POS', icon: ShoppingCartIcon },
      inventory: { label: 'Inventory', icon: CubeIcon },
      customers: { label: 'Customers', icon: UsersIcon },
      layby: { label: 'Layby', icon: ClockIcon },
      transactions: { label: 'Transactions', icon: ReceiptPercentIcon },
      expenses: { label: 'Expenses', icon: CreditCardIcon },
      settings: { label: 'Settings', icon: CogIcon },
      showcase: { label: 'Store Showcase', icon: GlobeAltIcon }
    };
    
    return availablePages.map(page => ({
      id: page,
      ...navigationMap[page],
      // Fallback for unmapped pages
      label: navigationMap[page]?.label || page.charAt(0).toUpperCase() + page.slice(1),
      icon: navigationMap[page]?.icon || CogIcon
    })).filter(item => item.icon); // Filter out items without icons
  };
  
  return {
    userRole,
    getAvailablePages,
    getNavigationItems
  };
}

/**
 * Hook for permission-based form field access
 */
export function useFieldPermissions() {
  const { hasPermission, userRole } = usePermissions();
  
  const canEditField = (fieldPermission: Permission) => {
    return hasPermission(fieldPermission);
  };
  
  const getFieldProps = (fieldPermission: Permission) => {
    const canEdit = hasPermission(fieldPermission);
    return {
      disabled: !canEdit,
      readOnly: !canEdit
    };
  };
  
  const isFieldVisible = (fieldPermission: Permission) => {
    return hasPermission(fieldPermission);
  };
  
  return {
    userRole,
    canEditField,
    getFieldProps,
    isFieldVisible
  };
}
