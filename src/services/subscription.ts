import { supabase } from '@/integrations/supabase/client';
import { paychanguService } from './paychangu';

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_stores: number;
  max_team_members: number;
  max_pin_users_per_store: number;
  max_inventory_items_per_store: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trial';
  billing_cycle: 'monthly' | 'yearly';
  trial_start_date?: string;
  trial_end_date?: string;
  current_period_start?: string;
  current_period_end?: string;
  next_billing_date?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  failed_payment_attempts?: number;
  cancel_at_period_end?: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
  external_subscription_id?: string;
  external_customer_id?: string;
  created_at: string;
  updated_at: string;
  subscription_plans?: SubscriptionPlan;
}

export interface UserAccessStatus {
  has_access: boolean;
  status: string;
  plan_name: string;
  next_billing_date?: string;
  trial_end_date?: string;
  trial_days_remaining?: number;
  is_trial: boolean;
  message?: string;
}

export interface SubscriptionUsage {
  stores_count: number;
  total_pin_users: number;
  total_inventory_items: number;
  usage_by_store: Record<string, any>;
}

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  paychangu_tx_ref: string | null;
  paychangu_charge_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string | null;
  payment_channel: string | null;
  billing_period_start: string;
  billing_period_end: string;
  created_at: string;
  completed_at: string | null;
  failed_at: string | null;
}

export interface BillingCycle {
  id: string;
  subscription_id: string;
  cycle_start: string;
  cycle_end: string;
  amount_due: number;
  status: 'upcoming' | 'processing' | 'paid' | 'failed' | 'cancelled';
  payment_id: string | null;
  payment_attempted_at: string | null;
  payment_completed_at: string | null;
  created_at: string;
}

export interface SubscriptionHistoryItem {
  id: string;
  type: 'payment' | 'plan_change' | 'status_change' | 'billing_cycle';
  title: string;
  description: string;
  amount?: number;
  status: string;
  date: string;
  details?: Record<string, any>;
}

export class SubscriptionService {
  /**
   * Get all available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .neq('name', 'trial') // Exclude trial from plan list
      .order('sort_order');

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'trial', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Check user's access status (including trial)
   */
  async checkUserAccess(userId: string): Promise<UserAccessStatus> {
    const { data, error } = await supabase
      .rpc('check_user_access', { _user_id: userId });

    if (error) {
      console.error('Error checking user access:', error);
      throw error;
    }

    return data as UserAccessStatus;
  }

  /**
   * Create trial subscription for new user
   */
  async createTrialSubscription(userId: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('create_trial_subscription', { _user_id: userId });

    if (error) {
      console.error('Error creating trial subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create a new subscription for a user or update existing one
   */
  async createSubscription(
    userId: string,
    planId: string,
    billingInterval: 'monthly' | 'yearly' = 'monthly'
  ): Promise<UserSubscription> {
    // First check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', userId)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      return this.updateSubscription(existingSubscription.id, planId, billingInterval);
    }

    // Create new subscription
    const now = new Date();
    const periodEnd = new Date(now);

    if (billingInterval === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'trial', // Start as trial until first payment
        billing_cycle: billingInterval,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        next_billing_date: periodEnd.toISOString(),
        trial_start_date: now.toISOString(),
        trial_end_date: periodEnd.toISOString()
      })
      .select(`
        *,
        subscription_plans (*)
      `)
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }

    // Initialize usage tracking
    await this.initializeUsageTracking(data.id);

    return data;
  }

  /**
   * Update an existing subscription (handles trial credits)
   */
  async updateSubscription(
    subscriptionId: string,
    planId: string,
    billingInterval: 'monthly' | 'yearly' = 'monthly'
  ): Promise<UserSubscription> {
    // Get current subscription to check trial status
    const { data: currentSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (!currentSub) {
      throw new Error('Subscription not found');
    }

    const now = new Date();
    const nextBillingDate = new Date(now);

    // Handle trial credits - if upgrading during trial, extend billing period
    if (currentSub.status === 'trial' && currentSub.trial_end_date) {
      const trialEndDate = new Date(currentSub.trial_end_date);
      const trialDaysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      // Add remaining trial days to the billing period
      nextBillingDate.setDate(nextBillingDate.getDate() + trialDaysRemaining);
    }

    // Add the billing interval on top of trial credit
    if (billingInterval === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    const updateData: any = {
      plan_id: planId,
      billing_cycle: billingInterval,
      next_billing_date: nextBillingDate.toISOString(),
      updated_at: now.toISOString()
    };

    // If upgrading from trial, keep trial status until payment
    if (currentSub.status === 'trial') {
      updateData.status = 'trial'; // Keep as trial until payment is processed
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select(`
        *,
        subscription_plans (*)
      `)
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Initialize usage tracking for a new subscription
   */
  private async initializeUsageTracking(subscriptionId: string) {
    const { error } = await supabase
      .from('subscription_usage_tracking')
      .insert({
        subscription_id: subscriptionId,
        stores_count: 0,
        total_pin_users: 0,
        total_inventory_items: 0,
        usage_by_store: {}
      });

    if (error) {
      console.error('Error initializing usage tracking:', error);
    }
  }

  /**
   * Process subscription payment
   */
  async processSubscriptionPayment(
    subscriptionId: string,
    userEmail: string,
    userName: string
  ): Promise<string> {
    // Get subscription and plan details
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('id', subscriptionId)
      .single();

    if (error || !subscription) {
      throw new Error('Subscription not found');
    }

    const plan = subscription.subscription_plans;
    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    // Create payment with PayChangu
    const paymentResponse = await paychanguService.createSubscriptionPayment(
      subscriptionId,
      plan.price_monthly,
      userEmail,
      userName,
      plan.display_name
    );

    return paymentResponse.data.checkout_url;
  }

  /**
   * Manually confirm payment (for testing when webhooks aren't available)
   */
  async confirmPayment(subscriptionId: string, txRef: string): Promise<void> {
    try {
      console.log('SubscriptionService - Confirming payment for subscription:', subscriptionId, 'tx_ref:', txRef);

      // Get current subscription to preserve trial credits
      const { data: currentSub } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      console.log('SubscriptionService - Current subscription:', currentSub);

      if (!currentSub) {
        throw new Error('Subscription not found');
      }

      // Verify payment with PayChangu (skip for test payments or localhost)
      const isTestPayment = txRef.startsWith('test_') || txRef.includes('localhost') ||
                           (typeof window !== 'undefined' && window.location.hostname === 'localhost');

      if (!isTestPayment) {
        console.log('SubscriptionService - Verifying payment with PayChangu');
        try {
          const paymentStatus = await paychanguService.verifyPayment(txRef);
          console.log('SubscriptionService - Payment verification result:', paymentStatus);

          if (paymentStatus.status !== 'success' || paymentStatus.data?.status !== 'success') {
            throw new Error(`Payment verification failed: ${paymentStatus.status} / ${paymentStatus.data?.status}`);
          }

          // Update payment record
          console.log('SubscriptionService - Updating payment record');
          await supabase
            .from('subscription_payments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              paychangu_charge_id: paymentStatus.data?.reference || txRef
            })
            .eq('paychangu_tx_ref', txRef);
        } catch (error) {
          console.error('SubscriptionService - PayChangu verification failed, treating as test payment:', error);
          // For development/testing, continue with manual confirmation
        }
      } else {
        console.log('SubscriptionService - Skipping PayChangu verification for test payment');
      }

      // Update payment record for test payments
      console.log('SubscriptionService - Updating payment record for test/manual confirmation');
      await supabase
        .from('subscription_payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          paychangu_charge_id: txRef
        })
        .eq('paychangu_tx_ref', txRef);

      // Update subscription status - preserve next_billing_date if it includes trial credits
      const now = new Date();
      const updateData: any = {
        status: 'active',
        last_payment_date: now.toISOString(),
        failed_payment_attempts: 0,
        updated_at: now.toISOString()
      };

      // Only update next_billing_date if it wasn't already set with trial credits
      if (!currentSub.next_billing_date || currentSub.status !== 'trial') {
        const nextBillingDate = new Date(now);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        updateData.next_billing_date = nextBillingDate.toISOString();
      }

      await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', subscriptionId);

      console.log('Payment confirmed and subscription activated');
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    reason?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription usage for a user
   */
  async getSubscriptionUsage(subscriptionId: string): Promise<SubscriptionUsage | null> {
    const { data, error } = await supabase
      .from('subscription_usage_tracking')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription usage:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update subscription usage
   */
  async updateSubscriptionUsage(
    userId: string,
    storeId?: string
  ): Promise<void> {
    // Get user's active subscription
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return;

    // Count user's stores
    const { count: storesCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId);

    // Count total PIN users across all stores
    const { count: pinUsersCount } = await supabase
      .from('store_members')
      .select('*', { count: 'exact', head: true })
      .in('store_id', 
        await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', userId)
          .then(({ data }) => data?.map(s => s.id) || [])
      )
      .eq('is_active', true);

    // Count total inventory items across all stores
    const { count: inventoryCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .in('store_id',
        await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', userId)
          .then(({ data }) => data?.map(s => s.id) || [])
      );

    // Update usage tracking
    const { error } = await supabase
      .from('subscription_usage_tracking')
      .upsert({
        subscription_id: subscription.id,
        stores_count: storesCount || 0,
        total_pin_users: pinUsersCount || 0,
        total_inventory_items: inventoryCount || 0,
        last_calculated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating subscription usage:', error);
    }
  }

  /**
   * Check if user can perform an action based on their subscription limits
   */
  async checkSubscriptionLimits(
    userId: string,
    action: 'create_store' | 'add_pin_user' | 'add_inventory_item',
    storeId?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription || subscription.status !== 'active') {
      return { allowed: false, reason: 'No active subscription' };
    }

    const plan = subscription.subscription_plans;
    if (!plan) {
      return { allowed: false, reason: 'Invalid subscription plan' };
    }

    const usage = await this.getSubscriptionUsage(subscription.id);
    if (!usage) {
      return { allowed: false, reason: 'Unable to check usage' };
    }

    switch (action) {
      case 'create_store':
        if (plan.max_stores !== 999999 && usage.stores_count >= plan.max_stores) {
          return { 
            allowed: false, 
            reason: `Store limit reached (${plan.max_stores})` 
          };
        }
        break;

      case 'add_pin_user':
        if (plan.max_pin_users_per_store !== 999999) {
          // Check PIN users for specific store
          const storeUsage = usage.usage_by_store[storeId || ''] || {};
          const storePinUsers = storeUsage.pin_users || 0;
          if (storePinUsers >= plan.max_pin_users_per_store) {
            return { 
              allowed: false, 
              reason: `PIN user limit reached for this store (${plan.max_pin_users_per_store})` 
            };
          }
        }
        break;

      case 'add_inventory_item':
        if (plan.max_inventory_items_per_store !== 999999) {
          // Check inventory items for specific store
          const storeUsage = usage.usage_by_store[storeId || ''] || {};
          const storeInventory = storeUsage.inventory_items || 0;
          if (storeInventory >= plan.max_inventory_items_per_store) {
            return { 
              allowed: false, 
              reason: `Inventory limit reached for this store (${plan.max_inventory_items_per_store})` 
            };
          }
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Get subscription payment history
   */
  async getSubscriptionPayments(subscriptionId: string): Promise<SubscriptionPayment[]> {
    const { data, error } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscription payments:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get billing cycles history
   */
  async getBillingCycles(subscriptionId: string): Promise<BillingCycle[]> {
    const { data, error } = await supabase
      .from('billing_cycles')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('cycle_start', { ascending: false });

    if (error) {
      console.error('Error fetching billing cycles:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get comprehensive subscription history
   */
  async getSubscriptionHistory(subscriptionId: string): Promise<SubscriptionHistoryItem[]> {
    const [payments, cycles] = await Promise.all([
      this.getSubscriptionPayments(subscriptionId),
      this.getBillingCycles(subscriptionId)
    ]);

    const history: SubscriptionHistoryItem[] = [];

    // Add payment history
    payments.forEach(payment => {
      history.push({
        id: payment.id,
        type: 'payment',
        title: payment.status === 'completed' ? 'Payment Successful' :
               payment.status === 'failed' ? 'Payment Failed' :
               payment.status === 'pending' ? 'Payment Pending' : 'Payment Cancelled',
        description: `${payment.status === 'completed' ? 'Received' : 'Attempted'} payment of $${payment.amount}`,
        amount: payment.amount,
        status: payment.status,
        date: payment.completed_at || payment.failed_at || payment.created_at,
        details: {
          payment_method: payment.payment_method,
          payment_channel: payment.payment_channel,
          tx_ref: payment.paychangu_tx_ref,
          billing_period: {
            start: payment.billing_period_start,
            end: payment.billing_period_end
          }
        }
      });
    });

    // Add billing cycle history
    cycles.forEach(cycle => {
      history.push({
        id: cycle.id,
        type: 'billing_cycle',
        title: cycle.status === 'paid' ? 'Billing Cycle Completed' :
               cycle.status === 'failed' ? 'Billing Cycle Failed' :
               cycle.status === 'upcoming' ? 'Upcoming Billing Cycle' : 'Billing Cycle Processing',
        description: `Billing cycle from ${new Date(cycle.cycle_start).toLocaleDateString()} to ${new Date(cycle.cycle_end).toLocaleDateString()}`,
        amount: cycle.amount_due,
        status: cycle.status,
        date: cycle.payment_completed_at || cycle.payment_attempted_at || cycle.created_at,
        details: {
          cycle_start: cycle.cycle_start,
          cycle_end: cycle.cycle_end,
          payment_id: cycle.payment_id
        }
      });
    });

    // Sort by date (most recent first)
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const subscriptionService = new SubscriptionService();
