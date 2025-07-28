import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser, useAuthLoading } from '@/stores/authStore';
import { useCurrentStore, useStoreLoading, useHasValidStoreSelection } from '@/stores/storeStore';
import { usePermissions, ProtectedPage } from '@/stores/permissionStore';
import { useAccessControl, AccessControlWrapper } from '@/middleware/accessControlNew';
import { sessionManager } from '@/lib/sessionManager';
import { usePageLoading } from '@/stores/loadingStore';
import { Loader2, Mail, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const user = useUser();
  const authLoading = useAuthLoading();
  const currentStore = useCurrentStore();
  const storeLoading = useStoreLoading();
  const hasValidStoreSelection = useHasValidStoreSelection();
  const { canAccessPage, loading: permissionLoading } = usePermissions();
  const setPageLoading = usePageLoading();
  const location = useLocation();
  const [sessionChecked, setSessionChecked] = useState(false);

  // Check for valid PIN session using session manager
  const pinSession = sessionManager.getPinSession();
  const hasPinSession = pinSession !== null;

  // Set up session expiry handling
  useEffect(() => {
    const handleSessionExpired = () => {
      // Only redirect if we're not already on a login page
      if (!location.pathname.includes('/auth') && !location.pathname.includes('/pin-login') && !location.pathname.includes('/store/')) {
        window.location.href = '/';
      }
    };

    sessionManager.onSessionExpired(handleSessionExpired);
    setSessionChecked(true);

    return () => {
      // Cleanup is handled by sessionManager singleton
    };
  }, [location.pathname]);

  // Fast loading check - only show loading for essential checks
  // For main users, wait for store loading to complete before making decisions
  const isLoading = authLoading || (user && !hasPinSession && storeLoading) || !sessionChecked;

  // Use unified loading system instead of local loading UI
  useEffect(() => {
    if (isLoading) {
      setPageLoading(true, 'Authenticating...');
    } else {
      setPageLoading(false);
    }

    return () => {
      setPageLoading(false);
    };
  }, [isLoading, setPageLoading]);

  // Don't render anything while loading - the LoadingProvider will handle the UI
  if (isLoading) {
    return null;
  }

  // More graceful authentication check - only redirect if we're sure there's no valid session
  if (!user && !hasPinSession) {
    // Don't redirect if we're already on a login page to prevent loops
    if (location.pathname.includes('/auth') || location.pathname.includes('/pin-login') || location.pathname.includes('/store/') || location.pathname === '/') {
      return <>{children}</>;
    }
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user's email is verified (only for main users, not PIN sessions)
  if (user && !hasPinSession && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-md w-full px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Mail className="h-12 w-12 text-blue-500" />
              </div>
              <CardTitle className="text-xl text-blue-600">
                Verify Your Email
              </CardTitle>
              <CardDescription>
                We've sent a verification link to <strong>{user.email}</strong>.
                Please check your email and click the link to verify your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>Didn't receive the email? Check your spam folder or</p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600"
                  onClick={async () => {
                    try {
                      await supabase.auth.resend({
                        type: 'signup',
                        email: user.email!
                      });
                      toast.success('Verification email sent!');
                    } catch (error) {
                      toast.error('Failed to resend email');
                    }
                  }}
                >
                  resend verification email
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => supabase.auth.signOut()}
                className="w-full"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user's email is verified (only for main users, not PIN sessions)
  if (user && !hasPinSession && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-md w-full px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Mail className="h-12 w-12 text-blue-500" />
              </div>
              <CardTitle className="text-xl text-blue-600">
                Verify Your Email
              </CardTitle>
              <CardDescription>
                We've sent a verification link to <strong>{user.email}</strong>.
                Please check your email and click the link to verify your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>Didn't receive the email? Check your spam folder or</p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600"
                  onClick={async () => {
                    try {
                      await supabase.auth.resend({
                        type: 'signup',
                        email: user.email!
                      });
                      toast.success('Verification email sent!');
                    } catch (error) {
                      toast.error('Failed to resend email');
                    }
                  }}
                >
                  resend verification email
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => supabase.auth.signOut()}
                className="w-full"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Strict store selection enforcement for main users
  if (user && !hasPinSession) {
    // Main users must have a valid store selection
    if (!hasValidStoreSelection || !currentStore) {
      return <Navigate to="/stores" replace />;
    }
  }

  // If PIN user but no current store, clear session and redirect more gracefully
  if (!currentStore && hasPinSession) {
    sessionManager.clearPinSession();
    // Only redirect if not already on a login page
    if (!location.pathname.includes('/pin-login') && !location.pathname.includes('/store/')) {
      return <Navigate to="/pin-login" replace />;
    }
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

  // Wrap with access control for authenticated users (not PIN sessions)
  if (user && !hasPinSession) {
    return (
      <AccessControlWrapper>
        {children}
      </AccessControlWrapper>
    );
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
