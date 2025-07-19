import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Users,
  Store,
  Package,
  Loader2
} from 'lucide-react';
import { useUser } from '@/stores/authStore';
import { subscriptionService, UserSubscription, SubscriptionUsage } from '@/services/subscription';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function SubscriptionStatus() {
  const user = useUser();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    try {
      const [subscriptionData, usageData] = await Promise.all([
        subscriptionService.getUserSubscription(user.id),
        subscriptionService.getUserSubscription(user.id).then(sub => 
          sub ? subscriptionService.getSubscriptionUsage(sub.id) : null
        )
      ]);

      setSubscription(subscriptionData);
      setUsage(usageData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setCancelling(true);
    try {
      await subscriptionService.cancelSubscription(
        subscription.id,
        'User requested cancellation'
      );
      toast.success('Subscription cancelled successfully');
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary/10 text-primary"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'past_due':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Past Due</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      case 'trialing':
        return <Badge className="bg-secondary/50 text-secondary-foreground"><Calendar className="w-3 h-3 mr-1" />Trial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateUsagePercentage = (current: number, max: number) => {
    if (max === 999999) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleTestPaymentConfirmation = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      // For testing, we'll simulate a successful payment confirmation
      // by calling the subscription service directly
      await subscriptionService.confirmPayment(subscription.id, `test_${Date.now()}`);

      toast.success('Payment confirmed successfully! Subscription is now active.');

      // Reload subscription data
      loadSubscriptionData();

    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error(error.message || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
          <p className="text-muted-foreground mb-4">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <Button>View Plans</Button>
        </CardContent>
      </Card>
    );
  }

  const plan = subscription.subscription_plans;
  if (!plan) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Unable to load subscription details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {plan.display_name} Plan
                {getStatusBadge(subscription.status)}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(plan.price_monthly)}</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Billing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Current Period</div>
                <div className="text-sm text-muted-foreground">
                  {subscription.current_period_start && subscription.current_period_end ? (
                    `${format(new Date(subscription.current_period_start), 'MMM d')} - ${format(new Date(subscription.current_period_end), 'MMM d, yyyy')}`
                  ) : (
                    'Not set'
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Next Billing</div>
                <div className="text-sm text-muted-foreground">
                  {subscription.next_billing_date ? format(new Date(subscription.next_billing_date), 'MMM d, yyyy') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Last Payment */}
          {subscription.last_payment_date && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <div>
                <div className="text-sm font-medium">Last Payment</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(subscription.last_payment_amount || 0)} on {format(new Date(subscription.last_payment_date), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
          )}

          {/* Failed Payment Attempts */}
          {(subscription.failed_payment_attempts || 0) > 0 && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <div className="text-sm text-destructive-foreground">
                {subscription.failed_payment_attempts || 0} failed payment attempt{(subscription.failed_payment_attempts || 0) > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Your current usage against plan limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stores Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <span className="text-sm font-medium">Stores</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usage.stores_count} / {plan.max_stores === 999999 ? '∞' : plan.max_stores}
                </span>
              </div>
              {plan.max_stores !== 999999 && (
                <Progress value={calculateUsagePercentage(usage.stores_count, plan.max_stores)} />
              )}
            </div>

            {/* PIN Users Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">PIN Users</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usage.total_pin_users} / {plan.max_pin_users_per_store === 999999 ? '∞' : `${plan.max_pin_users_per_store} per store`}
                </span>
              </div>
            </div>

            {/* Inventory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-medium">Inventory Items</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usage.total_inventory_items} / {plan.max_inventory_items_per_store === 999999 ? '∞' : `${plan.max_inventory_items_per_store} per store`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {subscription.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              onClick={handleCancelSubscription}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Development Testing Tools */}
      {import.meta.env.DEV && subscription && (
        <Card className="bg-warning/10 border-warning/20">
          <CardHeader>
            <CardTitle className="text-sm text-warning-foreground">Development Tools</CardTitle>
            <CardDescription className="text-muted-foreground">
              Testing tools for payment confirmation (only visible in development)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleTestPaymentConfirmation}
              variant="outline"
              size="sm"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Test: Confirm Latest Payment'
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will manually confirm the latest pending payment for testing purposes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
