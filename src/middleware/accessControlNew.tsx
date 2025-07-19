import { subscriptionService, UserAccessStatus } from '@/services/subscription';

// Note: Server-side middleware would go in a separate API file
// This file focuses on client-side access control

/**
 * Client-side function to check user access
 */
export async function checkUserAccess(): Promise<UserAccessStatus> {
  try {
    const response = await fetch('/api/auth/check-access', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check access');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking user access:', error);
    return {
      has_access: false,
      status: 'error',
      plan_name: 'Unknown',
      is_trial: false,
      message: 'Unable to verify access status'
    };
  }
}

/**
 * React hook for access control
 */
import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuthLoading } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

export function useAccessControl() {
  const user = useUser();
  const authLoading = useAuthLoading();
  const navigate = useNavigate();
  const [accessStatus, setAccessStatus] = useState<UserAccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    if (!user || authLoading) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const status = await subscriptionService.checkUserAccess(user.id);
      setAccessStatus(status);
      
      // If no access and not on subscription page, redirect
      if (!status.has_access && !window.location.pathname.includes('/subscription')) {
        navigate('/subscription');
      }
    } catch (err) {
      console.error('Error checking access:', err);
      setError('Failed to verify access status');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const refreshAccess = useCallback(() => {
    setLoading(true);
    checkAccess();
  }, [checkAccess]);

  return {
    accessStatus,
    loading,
    error,
    refreshAccess,
    hasAccess: accessStatus?.has_access || false,
    isTrialing: accessStatus?.is_trial || false,
    trialDaysRemaining: accessStatus?.trial_days_remaining || 0
  };
}

/**
 * Higher-order component to protect routes with access control
 */
import React from 'react';
import { Loader2, Lock, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AccessControlWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AccessControlWrapper({ children, fallback }: AccessControlWrapperProps) {
  const { accessStatus, loading, hasAccess, isTrialing, trialDaysRemaining } = useAccessControl();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-md w-full px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Lock className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-xl text-red-600">
                {accessStatus?.status === 'expired' ? 'Trial Expired' : 'Access Denied'}
              </CardTitle>
              <CardDescription>
                {accessStatus?.message || 'You need an active subscription to access this feature.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate('/subscription')}
                className="w-full"
              >
                {accessStatus?.status === 'expired' ? 'Choose a Plan' : 'View Subscription Plans'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show trial warning if user is in trial with less than 7 days remaining
  if (isTrialing && trialDaysRemaining <= 7) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Trial Warning Banner */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Trial expires in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}
              </span>
            </div>
            <Button 
              size="sm" 
              onClick={() => navigate('/subscription')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to protect specific actions
 */
export function useActionProtection() {
  const { hasAccess, accessStatus } = useAccessControl();

  const checkActionAccess = useCallback((actionName: string) => {
    if (!hasAccess) {
      return {
        allowed: false,
        reason: accessStatus?.message || 'No active subscription',
        redirectTo: '/subscription'
      };
    }

    return { allowed: true };
  }, [hasAccess, accessStatus]);

  return { checkActionAccess };
}
