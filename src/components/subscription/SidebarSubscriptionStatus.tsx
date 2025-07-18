import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Calendar, 
  Zap, 
  AlertTriangle, 
  Gift,
  CreditCard,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useSidebar } from '@/components/ui/sidebar';

export function SidebarSubscriptionStatus() {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { 
    subscription, 
    currentPlan, 
    isTrialing, 
    hasAccess, 
    trialDaysRemaining, 
    accessStatus,
    loading 
  } = useSubscription();

  const isCollapsed = state === 'collapsed';

  if (loading || !accessStatus) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  // Don't show if no access (user will be redirected anyway)
  if (!hasAccess) {
    return null;
  }

  // Trial Status
  if (isTrialing) {
    const isUrgent = trialDaysRemaining <= 3;
    const isWarning = trialDaysRemaining <= 7;
    const progressPercentage = Math.max(0, (trialDaysRemaining / 30) * 100);

    if (isCollapsed) {
      return (
        <div className="px-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpgrade}
            className={`w-full h-10 p-0 ${
              isUrgent 
                ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700' 
                : isWarning 
                ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
                : 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
            }`}
            title={`Free Trial - ${trialDaysRemaining} days remaining`}
          >
            {isUrgent ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Gift className="w-4 h-4" />
            )}
          </Button>
        </div>
      );
    }

    return (
      <Card className={`${
        isUrgent 
          ? 'border-red-200 bg-red-50' 
          : isWarning 
          ? 'border-yellow-200 bg-yellow-50'
          : 'border-blue-200 bg-blue-50'
      }`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gift className={`w-4 h-4 ${
                isUrgent ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-600'
              }`} />
              <span className={`text-sm font-medium ${
                isUrgent ? 'text-red-900' : isWarning ? 'text-yellow-900' : 'text-blue-900'
              }`}>
                Free Trial
              </span>
            </div>
            <Badge variant={isUrgent ? 'destructive' : isWarning ? 'secondary' : 'default'} className="text-xs">
              {trialDaysRemaining}d
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className={`h-1 ${
                isUrgent ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-yellow-500' : '[&>div]:bg-blue-500'
              }`}
            />
            <p className={`text-xs ${
              isUrgent ? 'text-red-700' : isWarning ? 'text-yellow-700' : 'text-blue-700'
            }`}>
              {isUrgent ? 'Expires soon!' : `${trialDaysRemaining} days left`}
            </p>
            <Button 
              size="sm" 
              onClick={handleUpgrade}
              className={`w-full h-7 text-xs ${
                isUrgent 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : isWarning 
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Zap className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active Subscription Status
  if (subscription && currentPlan) {
    const isPremium = currentPlan.name === 'enterprise';
    const isPopular = currentPlan.name === 'professional';

    if (isCollapsed) {
      return (
        <div className="px-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpgrade}
            className="w-full h-10 p-0 border-green-200 bg-green-50 hover:bg-green-100 text-green-700"
            title={`${currentPlan.display_name} Plan - Active`}
          >
            {isPremium ? (
              <Crown className="w-4 h-4" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
          </Button>
        </div>
      );
    }

    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isPremium ? (
                <Crown className="w-4 h-4 text-green-600" />
              ) : (
                <CreditCard className="w-4 h-4 text-green-600" />
              )}
              <span className="text-sm font-medium text-green-900">
                {currentPlan.display_name}
              </span>
            </div>
            <Badge className="bg-green-100 text-green-800 text-xs">
              Active
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-green-700">
              {isPremium && <Sparkles className="w-3 h-3" />}
              <span>
                {isPremium ? 'Unlimited everything' : 
                 isPopular ? '3 stores, 200 items each' : 
                 '1 store, 50 items'}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleUpgrade}
              className="w-full h-7 text-xs text-green-700 hover:bg-green-100"
            >
              Manage Plan
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

// Compact version for when sidebar is collapsed
export function SidebarSubscriptionBadge() {
  const { 
    isTrialing, 
    trialDaysRemaining, 
    currentPlan, 
    hasAccess 
  } = useSubscription();

  if (!hasAccess) return null;

  if (isTrialing) {
    const isUrgent = trialDaysRemaining <= 3;
    return (
      <Badge 
        variant={isUrgent ? 'destructive' : 'secondary'} 
        className="text-xs"
      >
        Trial {trialDaysRemaining}d
      </Badge>
    );
  }

  if (currentPlan) {
    return (
      <Badge className="bg-green-100 text-green-800 text-xs">
        {currentPlan.name === 'enterprise' ? 'Pro' : 
         currentPlan.name === 'professional' ? 'Plus' : 
         'Basic'}
      </Badge>
    );
  }

  return null;
}
