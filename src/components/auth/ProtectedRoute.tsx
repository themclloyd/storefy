import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { usePermissions, ProtectedPage } from '@/contexts/PermissionContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPage?: ProtectedPage;
  fallbackPath?: string;
  showUnauthorizedMessage?: boolean;
}

export function ProtectedRoute({
  children,
  requiredPage,
  fallbackPath = '/dashboard',
  showUnauthorizedMessage = true
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { currentStore, loading: storeLoading, hasValidStoreSelection } = useStore();
  const { canAccessPage, loading: permissionLoading, userRole } = usePermissions();
  const location = useLocation();

  // Check for PIN session
  const pinSession = localStorage.getItem('pin_session');
  const hasPinSession = pinSession !== null;

  // Fast loading check - only show loading for essential checks
  const isLoading = authLoading || storeLoading;

  // Show minimal loading only for critical auth/store checks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to landing page if not authenticated and no PIN session
  if (!user && !hasPinSession) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Strict store selection enforcement for main users
  if (user && !hasPinSession) {
    // Main users must have a valid store selection
    if (!hasValidStoreSelection || !currentStore) {
      return <Navigate to="/stores" replace />;
    }
  }

  // If PIN user but no current store, redirect to PIN login
  if (!currentStore && hasPinSession) {
    localStorage.removeItem('pin_session');
    return <Navigate to="/pin-login" replace />;
  }

  // For POS system speed, allow access while permissions load
  // Only block if we know for certain the user doesn't have access
  if (requiredPage && !permissionLoading) {
    const hasAccess = canAccessPage(requiredPage);

    if (!hasAccess) {
      // For POS critical pages, show minimal error
      if (requiredPage === 'pos' || requiredPage === 'dashboard') {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-muted-foreground">Access denied. Contact your manager.</p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        );
      }

      if (showUnauthorizedMessage) {
        return <UnauthorizedAccess requiredPage={requiredPage} fallbackPath={fallbackPath} />;
      } else {
        return <Navigate to={fallbackPath} replace />;
      }
    }
  }

  return <>{children}</>;
}

interface UnauthorizedAccessProps {
  requiredPage: ProtectedPage;
  fallbackPath: string;
}

function UnauthorizedAccess({ requiredPage, fallbackPath }: UnauthorizedAccessProps) {
  const { userRole } = usePermissions();
  
  const getPageDisplayName = (page: ProtectedPage): string => {
    const pageNames = {
      dashboard: 'Dashboard',
      pos: 'Point of Sale',
      inventory: 'Inventory Management',
      products: 'Product Management',
      categories: 'Category Management',
      suppliers: 'Supplier Management',
      customers: 'Customer Management',
      transactions: 'Transaction History',
      layby: 'Layby Management',
      reports: 'Reports & Analytics',
      expenses: 'Expense Management',
      settings: 'Store Settings'
    };
    
    return pageNames[page] || page;
  };

  const getRoleDisplayName = (role: string): string => {
    const roleNames = {
      owner: 'Store Owner',
      manager: 'Manager',
      cashier: 'Cashier'
    };
    
    return roleNames[role as keyof typeof roleNames] || role;
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Shield className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access {getPageDisplayName(requiredPage)}.
          </p>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Current Role:</strong> {userRole ? getRoleDisplayName(userRole.role) : 'Unknown'}
            <br />
            <strong>Required Access:</strong> This page requires higher privileges.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button 
            onClick={() => window.location.href = fallbackPath}
            className="w-full"
          >
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            If you believe this is an error, please contact your store owner or manager.
          </p>
        </div>
      </div>
    </div>
  );
}

// Higher-order component for easy route protection
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredPage: ProtectedPage
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredPage={requiredPage}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Specific protection components for common use cases
export function OwnerOnlyRoute({ children }: { children: React.ReactNode }) {
  const { userRole } = usePermissions();
  
  if (!userRole?.isOwner) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export function ManagerPlusRoute({ children }: { children: React.ReactNode }) {
  const { userRole } = usePermissions();
  
  if (!userRole || !['owner', 'manager'].includes(userRole.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export function CashierPlusRoute({ children }: { children: React.ReactNode }) {
  const { userRole } = usePermissions();
  
  if (!userRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}
