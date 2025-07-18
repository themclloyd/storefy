import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { TrialBanner, TrialStatusCard } from '@/components/subscription/TrialBanner';
import { subscriptionService, UserSubscription } from '@/services/subscription';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, CreditCard, Settings, Gift } from 'lucide-react';

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    subscription,
    isTrialing,
    hasAccess,
    trialDaysRemaining,
    loading: subscriptionLoading
  } = useSubscription();
  const [activeTab, setActiveTab] = useState('plans');

  useEffect(() => {
    // If user has an active subscription or trial, show status tab by default
    if (subscription && (subscription.status === 'active' || subscription.status === 'trial')) {
      setActiveTab('status');
    }
  }, [subscription]);

  const handlePlanSelected = () => {
    // Subscription data will be refreshed automatically by the hook
  };

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to manage your subscription
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Subscription - Storefy</title>
        <meta name="description" content="Manage your Storefy subscription" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Trial Banner */}
          {isTrialing && <TrialBanner className="mb-6" />}

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Subscription Management
            </h1>
            <p className="text-lg text-gray-600">
              {isTrialing
                ? `You're currently on a free trial with ${trialDaysRemaining} days remaining`
                : 'Choose the perfect plan for your business needs'
              }
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-8">
              <TabsTrigger value="plans" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Plans
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {isTrialing ? 'Trial' : 'Status'}
              </TabsTrigger>
              {isTrialing && (
                <TabsTrigger value="trial" className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Trial Info
                </TabsTrigger>
              )}
            </TabsList>

            {/* Plans Tab */}
            <TabsContent value="plans" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
                <p className="text-gray-600">
                  Select the plan that best fits your business requirements
                </p>
              </div>
              
              <SubscriptionPlans 
                onPlanSelected={handlePlanSelected}
                currentPlanId={subscription?.plan_id}
              />

              {/* Plan Comparison */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Plan Comparison</CardTitle>
                  <CardDescription>
                    Compare features across all plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Feature</th>
                          <th className="text-center py-2">Starter</th>
                          <th className="text-center py-2">Professional</th>
                          <th className="text-center py-2">Enterprise</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b">
                          <td className="py-2">Stores</td>
                          <td className="text-center py-2">1</td>
                          <td className="text-center py-2">3</td>
                          <td className="text-center py-2">Unlimited</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">PIN Users per Store</td>
                          <td className="text-center py-2">1</td>
                          <td className="text-center py-2">3</td>
                          <td className="text-center py-2">Unlimited</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Inventory Items per Store</td>
                          <td className="text-center py-2">50</td>
                          <td className="text-center py-2">200</td>
                          <td className="text-center py-2">Unlimited</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Support</td>
                          <td className="text-center py-2">Basic</td>
                          <td className="text-center py-2">Priority</td>
                          <td className="text-center py-2">24/7 Premium</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Advanced Analytics</td>
                          <td className="text-center py-2">❌</td>
                          <td className="text-center py-2">✅</td>
                          <td className="text-center py-2">✅</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">API Access</td>
                          <td className="text-center py-2">❌</td>
                          <td className="text-center py-2">❌</td>
                          <td className="text-center py-2">✅</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {isTrialing ? 'Trial Status' : 'Subscription Status'}
                </h2>
                <p className="text-gray-600">
                  {isTrialing
                    ? 'Monitor your trial usage and upgrade when ready'
                    : 'Manage your current subscription and view usage'
                  }
                </p>
              </div>

              <SubscriptionStatus />
            </TabsContent>

            {/* Trial Info Tab */}
            {isTrialing && (
              <TabsContent value="trial" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Trial Information</h2>
                  <p className="text-gray-600">
                    Learn about your free trial and upgrade options
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TrialStatusCard />

                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-purple-900 mb-3">What happens after trial?</h3>
                      <ul className="text-sm text-purple-700 space-y-2">
                        <li>• Your trial will automatically expire after 30 days</li>
                        <li>• You'll lose access to all features until you upgrade</li>
                        <li>• Your data will be preserved for 30 days</li>
                        <li>• You can upgrade anytime during or after trial</li>
                      </ul>
                      <Button
                        onClick={() => setActiveTab('plans')}
                        className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                      >
                        View Upgrade Plans
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>

          {/* Payment Security Notice */}
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Secure Payments</h3>
                  <p className="text-sm text-blue-700">
                    All payments are processed securely through PayChangu. 
                    We support mobile money, bank transfers, and card payments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// Ensure this page requires authentication
export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {},
  };
};
