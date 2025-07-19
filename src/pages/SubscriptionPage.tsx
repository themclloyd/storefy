import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/stores/authStore';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { SubscriptionHistory } from '@/components/subscription/SubscriptionHistory';
import { useSubscription } from '@/hooks/useSubscription';
import { CreditCard, Clock, CheckCircle, AlertTriangle, ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/modern-loading';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ThemeToggleButton } from '@/components/ui/theme-toggle';

import { toast } from 'sonner';

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    subscription,
    isTrialing,
    trialDaysRemaining,
    loading: subscriptionLoading
  } = useSubscription();
  const [view, setView] = useState<'overview' | 'plans' | 'manage'>('overview');



  // Simple status determination
  const getStatus = () => {
    if (isTrialing) {
      return {
        type: 'trial',
        title: 'Free Trial',
        description: `${trialDaysRemaining} days remaining`,
        icon: Clock,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        badge: 'Trial'
      };
    } else if (subscription?.status === 'active') {
      return {
        type: 'active',
        title: 'Active Subscription',
        description: subscription.plan_name || 'Active Plan',
        icon: CheckCircle,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        badge: 'Active'
      };
    } else if (subscription?.status === 'past_due') {
      return {
        type: 'past_due',
        title: 'Payment Required',
        description: 'Update payment method',
        icon: AlertTriangle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        badge: 'Past Due'
      };
    } else {
      return {
        type: 'none',
        title: 'No Subscription',
        description: 'Choose a plan to get started',
        icon: CreditCard,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
        badge: 'Inactive'
      };
    }
  };

  const status = getStatus();

  if (authLoading || subscriptionLoading) {
    return <PageLoading text="Loading subscription..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-foreground">Authentication Required</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please log in to manage your subscription
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar
        collapsible="icon"
        activeView="subscription"
        onViewChange={() => {}}
      />

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4 px-4">
            <SidebarTrigger className="h-8 w-8" />
            <div className="h-4 w-px bg-border" />
            <Breadcrumbs activeView="subscription" />
          </div>
          <div className="ml-auto px-4 flex items-center gap-2">
            <ThemeToggleButton />
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-4xl mx-auto">

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
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Subscription Dashboard
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Manage your Storefy subscription and track your usage
                  </p>
                </div>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${status.bgColor}`}>
                        <status.icon className={`w-8 h-8 ${status.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-semibold text-foreground">
                            {status.title}
                          </h2>
                          <Badge variant="secondary">{status.badge}</Badge>
                        </div>
                        <p className="text-lg text-muted-foreground">
                          {status.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {status.type === 'trial' && (
                        <Button onClick={() => setView('plans')} size="lg">
                          Upgrade Now
                        </Button>
                      )}
                      {status.type === 'active' && (
                        <>
                          <Button variant="outline" onClick={() => setView('plans')}>
                            Change Plan
                          </Button>
                          <Button onClick={() => setView('manage')}>
                            Manage
                          </Button>
                        </>
                      )}
                      {status.type === 'past_due' && (
                        <Button onClick={() => setView('manage')} variant="destructive">
                          Fix Payment
                        </Button>
                      )}
                      {status.type === 'none' && (
                        <Button onClick={() => setView('plans')} size="lg">
                          Choose Plan
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Quick Stats for Active Users */}
                {subscription && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {subscription.subscription_plans?.display_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">Current Plan</div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {subscription.next_billing_date ?
                            new Date(subscription.next_billing_date).toLocaleDateString() :
                            'N/A'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {isTrialing ? 'Trial Ends' : 'Next Billing'}
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary capitalize">
                          {subscription.status}
                        </div>
                        <div className="text-sm text-muted-foreground">Status</div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          ${subscription.subscription_plans?.price_monthly || '0'}
                        </div>
                        <div className="text-sm text-muted-foreground">Monthly Cost</div>
                      </div>
                    </Card>
                  </div>
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

                {/* Help Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Subscription Questions</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• All plans include core POS features</li>
                          <li>• Upgrade or downgrade anytime</li>
                          <li>• Trial days are credited on upgrade</li>
                          <li>• Cancel anytime with no penalties</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Support</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Need assistance with your subscription?
                        </p>
                        <Button variant="outline" size="sm">
                          Contact Support
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                    // Don't reload immediately - let the payment flow complete
                    // The payment flow will redirect to PayChangu and then back to our app
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
                          // Scroll to history section
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
                          // TODO: Implement usage analytics
                          toast.info('Usage analytics feature coming soon');
                        }}
                        className="h-20 flex-col gap-2"
                      >
                        <CheckCircle className="w-6 h-6" />
                        <span>Usage Analytics</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Information */}
                {subscription && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Billing Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Current Plan</h4>
                          <p className="text-muted-foreground">
                            {subscription.subscription_plans?.display_name || 'Unknown Plan'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Billing Cycle</h4>
                          <p className="text-muted-foreground capitalize">
                            {subscription.billing_cycle || 'Monthly'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Next Billing Date</h4>
                          <p className="text-muted-foreground">
                            {subscription.next_billing_date
                              ? new Date(subscription.next_billing_date).toLocaleDateString()
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Status</h4>
                          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscription.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Subscription History */}
                {subscription && (
                  <div data-subscription-history>
                    <SubscriptionHistory subscriptionId={subscription.id} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
