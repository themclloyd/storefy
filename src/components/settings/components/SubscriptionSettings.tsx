import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, useAuthLoading } from '@/stores/authStore';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { SubscriptionHistory } from '@/components/subscription/SubscriptionHistory';
import { useSubscription } from '@/hooks/useSubscription';
import { CreditCard, Clock, CheckCircle, AlertTriangle, ArrowLeft, Settings, Crown, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/modern-loading';
import { toast } from 'sonner';

export function SubscriptionSettings() {
  const user = useUser();
  const authLoading = useAuthLoading();
  const {
    subscription,
    isTrialing,
    trialDaysRemaining,
    loading: subscriptionLoading
  } = useSubscription();
  const [view, setView] = useState<'overview' | 'plans' | 'manage'>('overview');

  // Loading state
  if (authLoading || subscriptionLoading) {
    return <PageLoading />;
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Please log in to view subscription details.</p>
        </CardContent>
      </Card>
    );
  }

  // Determine subscription status
  const getSubscriptionStatus = () => {
    if (!subscription) {
      return {
        type: 'none' as const,
        title: 'No Active Subscription',
        description: 'Start your journey with Storefy',
        icon: <CreditCard className="w-6 h-6 text-muted-foreground" />,
        variant: 'secondary' as const
      };
    }

    if (subscription.status === 'trial' || isTrialing) {
      return {
        type: 'trial' as const,
        title: `Free Trial - ${trialDaysRemaining} days left`,
        description: 'Explore all features during your trial period',
        icon: <Gift className="w-6 h-6 text-blue-600" />,
        variant: 'default' as const
      };
    }

    if (subscription.status === 'active') {
      return {
        type: 'active' as const,
        title: 'Active Subscription',
        description: `${subscription.subscription_plans?.name} Plan`,
        icon: <Crown className="w-6 h-6 text-green-600" />,
        variant: 'default' as const
      };
    }

    if (subscription.status === 'past_due') {
      return {
        type: 'past_due' as const,
        title: 'Payment Required',
        description: 'Your subscription payment is overdue',
        icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
        variant: 'destructive' as const
      };
    }

    return {
      type: 'inactive' as const,
      title: 'Subscription Inactive',
      description: 'Reactivate to continue using premium features',
      icon: <Clock className="w-6 h-6 text-muted-foreground" />,
      variant: 'secondary' as const
    };
  };

  const status = getSubscriptionStatus();

  return (
    <div className="space-y-6">
      {/* Back Button for Plans/Manage Views */}
      {view !== 'overview' && (
        <Button
          variant="ghost"
          onClick={() => setView('overview')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </Button>
      )}

      {/* Overview - Simple Status Card */}
      {view === 'overview' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Subscription Management
            </h2>
            <p className="text-muted-foreground">
              Manage your Storefy subscription and track your usage
            </p>
          </div>

          {/* Current Status Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {status.icon}
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{status.title}</h3>
                  <p className="text-muted-foreground">{status.description}</p>
                </div>
              </div>
              <Badge variant={status.variant} className="text-sm px-3 py-1">
                {status.type === 'trial' ? 'Trial' : 
                 status.type === 'active' ? 'Active' : 
                 status.type === 'past_due' ? 'Past Due' : 
                 status.type === 'none' ? 'No Plan' : 'Inactive'}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {(status.type === 'none' || status.type === 'trial') && (
                <Button 
                  onClick={() => setView('plans')}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {status.type === 'trial' ? 'Upgrade Now' : 'Choose Plan'}
                </Button>
              )}
              
              {status.type === 'active' && (
                <>
                  <Button 
                    onClick={() => setView('plans')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Change Plan
                  </Button>
                  <Button 
                    onClick={() => setView('manage')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </Button>
                </>
              )}
              
              {status.type === 'past_due' && (
                <Button 
                  onClick={() => setView('manage')}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Update Payment
                </Button>
              )}
              
              {status.type === 'inactive' && (
                <Button 
                  onClick={() => setView('plans')}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Reactivate
                </Button>
              )}
            </div>
          </Card>

          {/* Subscription Details */}
          {subscription && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="ml-2 font-medium">{subscription.subscription_plans?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Billing:</span>
                  <span className="ml-2 font-medium capitalize">{subscription.billing_cycle}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 font-medium capitalize">{subscription.status}</span>
                </div>
                {subscription.next_billing_date && (
                  <div>
                    <span className="text-muted-foreground">Next Billing:</span>
                    <span className="ml-2 font-medium">
                      {new Date(subscription.next_billing_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Trial Progress for Trial Users */}
          {status.type === 'trial' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Trial Progress</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Days Used</span>
                  <span>{30 - trialDaysRemaining}/30</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((30 - trialDaysRemaining) / 30) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Upgrade anytime to continue using Storefy after your trial ends.
                </p>
              </div>
            </Card>
          )}

          {/* Subscription History */}
          {subscription && (
            <SubscriptionHistory subscriptionId={subscription.id} />
          )}
        </div>
      )}

      {/* Plans View */}
      {view === 'plans' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {status.type === 'active' ? 'Change Plan' : 'Choose Your Plan'}
            </h2>
            <p className="text-muted-foreground">
              Select the plan that best fits your business needs
            </p>
          </div>
          <SubscriptionPlans
            onPlanSelected={(planId) => {
              console.log('Plan selected:', planId);
            }}
            currentPlanId={subscription?.plan_id}
            isTrialing={isTrialing}
          />
        </div>
      )}

      {/* Manage View */}
      {view === 'manage' && (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Manage Subscription
            </h2>
            <p className="text-muted-foreground">
              View and manage your subscription details, usage, and billing
            </p>
          </div>

          {/* Subscription Status */}
          <SubscriptionStatus />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setView('plans')}
                  className="h-20 flex-col gap-2"
                >
                  <CreditCard className="w-6 h-6" />
                  <span>Change Plan</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const historyElement = document.querySelector('[data-subscription-history]');
                    if (historyElement) {
                      historyElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="h-20 flex-col gap-2"
                >
                  <Clock className="w-6 h-6" />
                  <span>View History</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.info('Contact support for billing assistance');
                  }}
                  className="h-20 flex-col gap-2"
                >
                  <AlertTriangle className="w-6 h-6" />
                  <span>Get Help</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription History */}
          {subscription && (
            <div data-subscription-history>
              <SubscriptionHistory subscriptionId={subscription.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
