import { supabase } from '@/integrations/supabase/client';
import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SubscriptionLimitCheck {
  allowed: boolean;
  reason?: string;
}

// Note: Server-side middleware would go in a separate API file
// This file focuses on client-side subscription limit checking

/**
 * Client-side function to check subscription limits
 */
export async function checkSubscriptionLimits(
  action: 'create_store' | 'add_pin_user' | 'add_inventory_item',
  storeId?: string
): Promise<SubscriptionLimitCheck> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .rpc('check_subscription_limits', {
        _user_id: user.user.id,
        _action: action,
        _store_id: storeId || null
      });

    if (error) {
      console.error('Error checking subscription limits:', error);
      return { allowed: false, reason: 'Failed to check subscription limits' };
    }

    return data as SubscriptionLimitCheck;
  } catch (error) {
    console.error('Error in checkSubscriptionLimits:', error);
    return { allowed: false, reason: 'Unexpected error' };
  }
}

/**
 * React hook to check subscription limits
 */

export function useSubscriptionLimits() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkLimits = useCallback(async (
    action: 'create_store' | 'add_pin_user' | 'add_inventory_item',
    storeId?: string
  ): Promise<SubscriptionLimitCheck> => {
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    setChecking(true);
    try {
      const result = await checkSubscriptionLimits(action, storeId);
      return result;
    } finally {
      setChecking(false);
    }
  }, [user]);

  const checkAndWarn = useCallback(async (
    action: 'create_store' | 'add_pin_user' | 'add_inventory_item',
    storeId?: string,
    onLimitExceeded?: (reason: string) => void
  ): Promise<boolean> => {
    const result = await checkLimits(action, storeId);
    
    if (!result.allowed && onLimitExceeded && result.reason) {
      onLimitExceeded(result.reason);
    }
    
    return result.allowed;
  }, [checkLimits]);

  return {
    checkLimits,
    checkAndWarn,
    checking
  };
}

/**
 * Higher-order component to wrap components with subscription limit checking
 */

export function withSubscriptionLimitCheck<P extends object>(
  Component: React.ComponentType<P>,
  action: 'create_store' | 'add_pin_user' | 'add_inventory_item',
  getStoreId?: (props: P) => string | undefined
) {
  return function WrappedComponent(props: P) {
    const { checkAndWarn } = useSubscriptionLimits();
    const [limitChecked, setLimitChecked] = useState(false);
    const [limitAllowed, setLimitAllowed] = useState(false);

    React.useEffect(() => {
      const checkLimit = async () => {
        const storeId = getStoreId ? getStoreId(props) : undefined;
        const allowed = await checkAndWarn(action, storeId, (reason) => {
          toast.error(`Subscription limit exceeded: ${reason}`);
        });
        setLimitAllowed(allowed);
        setLimitChecked(true);
      };

      checkLimit();
    }, [props, checkAndWarn]);

    if (!limitChecked) {
      return <div>Checking subscription limits...</div>;
    }

    if (!limitAllowed) {
      return (
        <div className="text-center p-4">
          <p className="text-muted-foreground">
            This feature is not available with your current subscription plan.
          </p>
          <button 
            onClick={() => window.location.href = '/subscription'}
            className="mt-2 text-primary hover:underline"
          >
            Upgrade your plan
          </button>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
