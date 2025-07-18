import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService, UserSubscription, SubscriptionPlan, SubscriptionUsage, UserAccessStatus } from '@/services/subscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [accessStatus, setAccessStatus] = useState<UserAccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subscription data
  const loadSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [subscriptionData, accessData] = await Promise.all([
        subscriptionService.getUserSubscription(user.id),
        subscriptionService.checkUserAccess(user.id)
      ]);

      setSubscription(subscriptionData);
      setAccessStatus(accessData);

      if (subscriptionData) {
        const usageData = await subscriptionService.getSubscriptionUsage(subscriptionData.id);
        setUsage(usageData);
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load available plans
  const loadPlans = useCallback(async () => {
    try {
      const plansData = await subscriptionService.getSubscriptionPlans();
      setPlans(plansData);
    } catch (err) {
      console.error('Error loading plans:', err);
      setError('Failed to load subscription plans');
    }
  }, []);

  // Initialize data
  useEffect(() => {
    loadSubscription();
    loadPlans();
  }, [loadSubscription, loadPlans]);

  // Auto-create trial and profile if user has no subscription (fallback only)
  useEffect(() => {
    const setupNewUser = async () => {
      // Only run for verified users who don't have a subscription yet
      if (user && user.email_confirmed_at && !loading && !subscription && !error) {
        try {
          console.log('Setting up verified user...');

          // First create profile if it doesn't exist
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (!existingProfile) {
            console.log('Creating user profile...');
            await supabase
              .from('profiles')
              .insert({
                user_id: user.id,
                display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
              });
          }

          // Then create trial subscription
          console.log('Creating trial subscription...');
          await subscriptionService.createTrialSubscription(user.id);

          // Reload subscription data
          loadSubscription();
        } catch (error) {
          console.error('Failed to setup new user:', error);
        }
      }
    };

    // Small delay to ensure user data is fully loaded
    const timer = setTimeout(setupNewUser, 1000);
    return () => clearTimeout(timer);
  }, [user, loading, subscription, error, loadSubscription]);

  // Check if user can perform an action
  const checkLimits = useCallback(async (
    action: 'create_store' | 'add_pin_user' | 'add_inventory_item',
    storeId?: string
  ) => {
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    try {
      return await subscriptionService.checkSubscriptionLimits(user.id, action, storeId);
    } catch (err) {
      console.error('Error checking limits:', err);
      return { allowed: false, reason: 'Unable to check subscription limits' };
    }
  }, [user]);

  // Update usage tracking
  const updateUsage = useCallback(async (storeId?: string) => {
    if (!user) return;

    try {
      await subscriptionService.updateSubscriptionUsage(user.id, storeId);
      // Reload subscription data to get updated usage
      await loadSubscription();
    } catch (err) {
      console.error('Error updating usage:', err);
    }
  }, [user, loadSubscription]);

  // Create subscription
  const createSubscription = useCallback(async (
    planId: string,
    billingInterval: 'monthly' | 'yearly' = 'monthly'
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const newSubscription = await subscriptionService.createSubscription(
        user.id,
        planId,
        billingInterval
      );
      setSubscription(newSubscription);
      return newSubscription;
    } catch (err) {
      console.error('Error creating subscription:', err);
      throw err;
    }
  }, [user]);

  // Process payment
  const processPayment = useCallback(async (subscriptionId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const checkoutUrl = await subscriptionService.processSubscriptionPayment(
        subscriptionId,
        user.email || '',
        user.user_metadata?.full_name || 'Customer'
      );
      return checkoutUrl;
    } catch (err) {
      console.error('Error processing payment:', err);
      throw err;
    }
  }, [user]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (reason?: string) => {
    if (!subscription) {
      throw new Error('No active subscription');
    }

    try {
      await subscriptionService.cancelSubscription(subscription.id, reason);
      await loadSubscription(); // Reload to get updated status
      toast.success('Subscription cancelled successfully');
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      toast.error('Failed to cancel subscription');
      throw err;
    }
  }, [subscription, loadSubscription]);

  // Get current plan
  const currentPlan = subscription?.subscription_plans || null;

  // Check if subscription is active
  const isActive = subscription?.status === 'active';

  // Check if subscription is past due
  const isPastDue = subscription?.status === 'past_due';

  // Check if subscription is cancelled
  const isCancelled = subscription?.status === 'cancelled';

  // Check if subscription is in trial
  const isTrialing = subscription?.status === 'trial';

  // Check if user has access (active subscription or valid trial)
  const hasAccess = accessStatus?.has_access || false;

  // Get trial days remaining
  const trialDaysRemaining = accessStatus?.trial_days_remaining || 0;

  // Get days until next billing
  const daysUntilBilling = subscription?.next_billing_date 
    ? Math.ceil((new Date(subscription.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Get usage percentages
  const getUsagePercentage = useCallback((type: 'stores' | 'pin_users' | 'inventory') => {
    if (!usage || !currentPlan) return 0;

    switch (type) {
      case 'stores':
        if (currentPlan.max_stores === 999999) return 0; // Unlimited
        return Math.min((usage.stores_count / currentPlan.max_stores) * 100, 100);
      
      case 'pin_users':
        if (currentPlan.max_pin_users_per_store === 999999) return 0; // Unlimited
        // This is a simplified calculation - in reality you'd want per-store tracking
        return Math.min((usage.total_pin_users / (currentPlan.max_pin_users_per_store * usage.stores_count || 1)) * 100, 100);
      
      case 'inventory':
        if (currentPlan.max_inventory_items_per_store === 999999) return 0; // Unlimited
        // This is a simplified calculation - in reality you'd want per-store tracking
        return Math.min((usage.total_inventory_items / (currentPlan.max_inventory_items_per_store * usage.stores_count || 1)) * 100, 100);
      
      default:
        return 0;
    }
  }, [usage, currentPlan]);

  return {
    // Data
    subscription,
    currentPlan,
    plans,
    usage,
    accessStatus,
    loading,
    error,

    // Status checks
    isActive,
    isPastDue,
    isCancelled,
    isTrialing,
    hasAccess,
    trialDaysRemaining,
    daysUntilBilling,

    // Actions
    createSubscription,
    processPayment,
    cancelSubscription,
    checkLimits,
    updateUsage,
    loadSubscription,

    // Utilities
    getUsagePercentage,
  };
}
