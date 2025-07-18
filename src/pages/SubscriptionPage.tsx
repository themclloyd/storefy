import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { useSubscription } from '@/hooks/useSubscription';
import { CreditCard, Clock, CheckCircle, AlertTriangle, ArrowLeft, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/modern-loading';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ThemeToggleButton } from '@/components/ui/theme-toggle';
import { paychanguService } from '@/services/paychangu';
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

  // Debug function to test PayChangu API
  const testPayChanguAPI = async () => {
    try {
      console.log('Testing PayChangu API...');
      toast.info('Testing PayChangu API...');

      // Test with a dummy tx_ref to see the API response
      const result = await paychanguService.verifyPayment('test_tx_ref_123');
      console.log('PayChangu API test result:', result);
      toast.success('PayChangu API test completed - check console');
    } catch (error: any) {
      console.error('PayChangu API test error:', error);
      toast.error(`PayChangu API test failed: ${error.message}`);
    }
  };

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
            {/* Debug button - remove in production */}
            <Button
              variant="outline"
              size="sm"
              onClick={testPayChanguAPI}
              className="text-xs"
            >
              <Bug className="w-3 h-3 mr-1" />
              Test API
            </Button>
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
                    Subscription
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your Storefy subscription
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
                {status.type === 'active' && subscription && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {subscription.plan_name}
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
                        <div className="text-sm text-muted-foreground">Next Billing</div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          Active
                        </div>
                        <div className="text-sm text-muted-foreground">Status</div>
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
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Manage Subscription
                  </h2>
                  <p className="text-muted-foreground">
                    View and manage your subscription details
                  </p>
                </div>
                <SubscriptionStatus />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
