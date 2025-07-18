import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Loader2, Calendar, Lock, Zap, Crown, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService, SubscriptionPlan } from '@/services/subscription';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  onPlanSelected?: (planId: string) => void;
  currentPlanId?: string;
}

export function SubscriptionPlans({ onPlanSelected, currentPlanId }: SubscriptionPlansProps) {
  const { user } = useAuth();
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
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
    <div className="max-w-6xl mx-auto">
      {/* Trial Upgrade Banner */}
      {isTrialing && (
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">
                {getTrialPhase() === 'late'
                  ? `Trial Ending Soon - ${trialDaysRemaining} Days Left!`
                  : `You're on a Free Trial - ${trialDaysRemaining} Days Remaining`
                }
              </h3>
            </div>
            <p className="text-blue-700 text-sm mb-3">
              {getTrialPhase() === 'late'
                ? 'Upgrade now to continue with full access after your trial ends'
                : 'Upgrade anytime during your trial - unused trial days will be credited to your account'
              }
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-blue-600">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>No commitment during trial</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Trial days credited on upgrade</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative ${plan.is_popular ? 'border-primary shadow-lg' : ''} ${
            isCurrentPlan(plan.id) ? 'ring-2 ring-primary' : ''
          }`}
        >
          {plan.is_popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>
          )}
          
          {isCurrentPlan(plan.id) && (
            <div className="absolute -top-3 right-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Current Plan
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              {plan.display_name}
              {plan.display_name === 'Enterprise' && <Crown className="w-5 h-5 text-yellow-500" />}
              {plan.display_name === 'Professional' && <Zap className="w-5 h-5 text-blue-500" />}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {plan.description}
            </CardDescription>

            {/* Trial Benefit Banner */}
            {isTrialing && !isCurrentPlan(plan.id) && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Gift className="w-4 h-4" />
                  <span className="text-xs font-medium">{getTrialBenefit()}</span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <span className="text-4xl font-bold">{formatPrice(plan.price_monthly)}</span>
              <span className="text-muted-foreground">/month</span>

              {/* Trial Credit Notice */}
              {isTrialing && !isCurrentPlan(plan.id) && (
                <div className="mt-2 text-xs text-green-600">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Remaining trial days will be credited
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Plan Limits */}
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Check className="w-4 h-4 text-primary mr-2" />
                <span>
                  {plan.max_stores === 999999 ? 'Unlimited' : plan.max_stores} Store{plan.max_stores !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="w-4 h-4 text-primary mr-2" />
                <span>
                  {plan.max_pin_users_per_store === 999999 ? 'Unlimited' : plan.max_pin_users_per_store} PIN User{plan.max_pin_users_per_store !== 1 ? 's' : ''} per Store
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="w-4 h-4 text-primary mr-2" />
                <span>
                  {plan.max_inventory_items_per_store === 999999 ? 'Unlimited' : plan.max_inventory_items_per_store} Inventory Items per Store
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="pt-4 space-y-2">
              {isCurrentPlan(plan.id) ? (
                <Button disabled className="w-full">
                  <Check className="w-4 h-4 mr-2" />
                  Current Plan
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={processingPlan === plan.id}
                    variant={getUpgradeUrgency(plan.display_name).variant}
                    className={`w-full ${
                      plan.is_popular ? 'bg-primary hover:bg-primary/90 text-white' : ''
                    } ${
                      getUpgradeUrgency(plan.display_name).urgency === 'high'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                        : ''
                    }`}
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isTrialing ? (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            {getTrialPhase() === 'late' ? 'Upgrade Now' : 'Upgrade Early'}
                          </>
                        ) : (
                          'Select Plan'
                        )}
                      </>
                    )}
                  </Button>

                  {/* Upgrade Message */}
                  {isTrialing && (
                    <p className="text-xs text-center text-muted-foreground">
                      {getUpgradeMessage(plan.display_name)}
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
