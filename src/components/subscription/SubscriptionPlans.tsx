import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Loader2, Calendar, Lock, Zap, Crown, Gift, CreditCard } from 'lucide-react';
import { useUser } from '@/stores/authStore';
import { subscriptionService, SubscriptionPlan } from '@/services/subscription';
import { useSubscription } from '@/hooks/useSubscription';
import { formatCurrency } from '@/lib/taxUtils';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  onPlanSelected?: (planId: string) => void;
  currentPlanId?: string;
}

export function SubscriptionPlans({ onPlanSelected, currentPlanId }: SubscriptionPlansProps) {
  const user = useUser();
  const { subscription, isTrialing, trialDaysRemaining } = useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const plansData = await subscriptionService.getSubscriptionPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast.error('Please log in to select a plan');
      return;
    }

    console.log('Starting plan selection for plan:', planId);
    setProcessingPlan(planId);

    try {
      console.log('Creating subscription for user:', user.id);
      // Create subscription
      const subscription = await subscriptionService.createSubscription(user.id, planId);
      console.log('Subscription created:', subscription);

      console.log('Processing payment for subscription:', subscription.id);
      // Process payment
      const checkoutUrl = await subscriptionService.processSubscriptionPayment(
        subscription.id,
        user.email || '',
        user.user_metadata?.full_name || 'Customer'
      );

      console.log('Payment checkout URL received:', checkoutUrl);

      if (!checkoutUrl) {
        throw new Error('No checkout URL received from payment processor');
      }

      // Call onPlanSelected before redirect
      if (onPlanSelected) {
        onPlanSelected(planId);
      }

      // Redirect to PayChangu checkout
      console.log('Redirecting to checkout URL:', checkoutUrl);
      window.location.href = checkoutUrl;

    } catch (error: any) {
      console.error('Error selecting plan:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });

      // Handle specific error cases
      if (error.code === '23505') {
        toast.error('You already have a subscription. Please contact support to change plans.');
      } else if (error.message?.includes('PayChangu')) {
        toast.error('Payment service is temporarily unavailable. Please try again later.');
      } else {
        toast.error(error.message || 'Failed to process subscription. Please try again.');
      }
    } finally {
      setProcessingPlan(null);
    }
  };

  const formatPrice = (price: number) => {
    return formatCurrency(price, 'USD');
  };

  // Helper functions for smart upgrade logic
  const getTrialPhase = () => {
    if (!isTrialing || !trialDaysRemaining) return 'none';
    if (trialDaysRemaining > 21) return 'early'; // Days 1-7 of 30-day trial
    if (trialDaysRemaining > 7) return 'mid';   // Days 8-21
    return 'late'; // Days 22-30 (last week)
  };

  const getUpgradeMessage = (planName: string) => {
    const phase = getTrialPhase();

    switch (phase) {
      case 'early':
        return `Upgrade to ${planName} anytime during your trial`;
      case 'mid':
        return `Ready to unlock everything? Upgrade to ${planName}`;
      case 'late':
        return `Trial ends in ${trialDaysRemaining} days - Upgrade to ${planName}`;
      default:
        return `Upgrade to ${planName}`;
    }
  };

  const getUpgradeUrgency = (planName: string) => {
    const phase = getTrialPhase();

    switch (phase) {
      case 'early':
        return { variant: 'outline' as const, urgency: 'low' };
      case 'mid':
        return { variant: 'default' as const, urgency: 'medium' };
      case 'late':
        return { variant: 'default' as const, urgency: 'high' };
      default:
        return { variant: 'default' as const, urgency: 'medium' };
    }
  };

  const getTrialBenefit = () => {
    if (!isTrialing) return null;

    const phase = getTrialPhase();
    switch (phase) {
      case 'early':
        return `${trialDaysRemaining} days left in your free trial`;
      case 'mid':
        return `${trialDaysRemaining} days of trial remaining`;
      case 'late':
        return `Trial expires in ${trialDaysRemaining} days`;
      default:
        return null;
    }
  };

  const isCurrentPlan = (planId: string) => {
    // During trial, no plan should be marked as "current"
    if (isTrialing) return false;
    return planId === currentPlanId;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Trial Upgrade Banner */}
      {isTrialing && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gift className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-blue-900">
                {getTrialPhase() === 'late'
                  ? `Trial Ending Soon - ${trialDaysRemaining} Days Left!`
                  : `You're on a Free Trial - ${trialDaysRemaining} Days Remaining`
                }
              </h3>
            </div>
            <p className="text-blue-700 mb-4 max-w-2xl mx-auto">
              {getTrialPhase() === 'late'
                ? 'Upgrade now to continue with full access after your trial ends. Choose the plan that best fits your business needs.'
                : 'Upgrade anytime during your trial - unused trial days will be credited to your account. No commitment required.'
              }
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-blue-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>No commitment during trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Trial days credited on upgrade</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Comparison Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Choose the Perfect Plan for Your Business
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Start with our free trial and upgrade when you're ready. All plans include core POS features,
          inventory management, and sales reporting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative transition-all duration-200 hover:shadow-lg ${
            plan.is_popular
              ? 'border-primary shadow-lg scale-105 bg-gradient-to-b from-primary/5 to-background'
              : 'border-border hover:border-primary/50'
          } ${
            isCurrentPlan(plan.id) ? 'ring-2 ring-primary' : ''
          }`}
        >
          {plan.is_popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-lg">
                <Star className="w-4 h-4 mr-2" />
                Most Popular
              </Badge>
            </div>
          )}

          {isCurrentPlan(plan.id) && (
            <div className="absolute -top-4 right-4 z-10">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Current Plan
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-6">
            <div className="mb-4">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
                {plan.display_name}
                {plan.display_name === 'Enterprise' && <Crown className="w-6 h-6 text-yellow-500" />}
                {plan.display_name === 'Professional' && <Zap className="w-6 h-6 text-blue-500" />}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground leading-relaxed">
                {plan.description}
              </CardDescription>
            </div>

            {/* Pricing */}
            <div className="mb-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-foreground">{formatPrice(plan.price_monthly)}</span>
                <span className="text-muted-foreground text-lg">/month</span>
              </div>
              {plan.price_yearly && parseFloat(plan.price_yearly) > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <span className="line-through">{formatPrice(parseFloat(plan.price_yearly) / 12)}</span>
                  <span className="ml-2 text-green-600 font-medium">
                    Save {Math.round((1 - (parseFloat(plan.price_yearly) / 12) / plan.price_monthly) * 100)}% yearly
                  </span>
                </div>
              )}
            </div>

            {/* Trial Benefit Banner */}
            {isTrialing && !isCurrentPlan(plan.id) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Gift className="w-4 h-4" />
                  <span className="text-sm font-medium">{getTrialBenefit()}</span>
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Remaining trial days will be credited
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key Limits - Highlighted */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm text-foreground mb-3">Plan Limits</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stores</span>
                  <span className="font-medium">
                    {plan.max_stores === 999999 ? 'Unlimited' : plan.max_stores}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">PIN Users per Store</span>
                  <span className="font-medium">
                    {plan.max_pin_users_per_store === 999999 ? 'Unlimited' : plan.max_pin_users_per_store}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Inventory Items per Store</span>
                  <span className="font-medium">
                    {plan.max_inventory_items_per_store === 999999 ? 'Unlimited' : plan.max_inventory_items_per_store}
                  </span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">What's Included</h4>
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-6 space-y-3">
              {isCurrentPlan(plan.id) ? (
                <Button disabled className="w-full h-12 bg-green-100 text-green-800 border-green-200">
                  <Check className="w-4 h-4 mr-2" />
                  Current Plan
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={processingPlan === plan.id}
                    size="lg"
                    className={`w-full h-12 font-semibold transition-all duration-200 ${
                      plan.is_popular
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl'
                        : 'bg-background border-2 border-primary text-primary hover:bg-primary hover:text-white'
                    } ${
                      getUpgradeUrgency(plan.display_name).urgency === 'high'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white animate-pulse'
                        : ''
                    }`}
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isTrialing ? (
                          <>
                            <Zap className="w-5 h-5 mr-2" />
                            {getTrialPhase() === 'late' ? 'Upgrade Now' : `Upgrade to ${  plan.display_name}`}
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5 mr-2" />
                            Choose {plan.display_name}
                          </>
                        )}
                      </>
                    )}
                  </Button>

                  {/* Upgrade Message */}
                  {isTrialing && (
                    <p className="text-sm text-center text-muted-foreground leading-relaxed">
                      {getUpgradeMessage(plan.display_name)}
                    </p>
                  )}

                  {/* Value Proposition */}
                  {!isTrialing && (
                    <p className="text-xs text-center text-muted-foreground">
                      {plan.display_name === 'Starter' && 'Perfect for getting started'}
                      {plan.display_name === 'Professional' && 'Best value for growing businesses'}
                      {plan.display_name === 'Enterprise' && 'Complete solution for large operations'}
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}
