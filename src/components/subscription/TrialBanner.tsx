import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  Zap, 
  ArrowRight, 
  Gift,
  AlertTriangle 
} from 'lucide-react';
import { useAccessControl } from '@/middleware/accessControlNew';
import { useSubscription } from '@/hooks/useSubscription';

interface TrialBannerProps {
  variant?: 'banner' | 'card' | 'alert';
  showUpgradeButton?: boolean;
  className?: string;
}

export function TrialBanner({
  variant = 'banner',
  showUpgradeButton = true,
  className = ''
}: TrialBannerProps) {
  const navigate = useNavigate();
  const { accessStatus } = useAccessControl();
  const { isTrialing, trialDaysRemaining } = useSubscription();

  if (!isTrialing || !accessStatus) {
    return null;
  }

  const isUrgent = trialDaysRemaining <= 3;
  const isWarning = trialDaysRemaining <= 7;

  const handleUpgrade = () => {
    navigate('/subscription?tab=plans');
  };

  if (variant === 'alert') {
    return (
      <Alert className={`${isUrgent ? 'border-destructive/50 bg-destructive/10' : isWarning ? 'border-warning/50 bg-warning/10' : 'border-primary/50 bg-primary/10'} ${className}`}>
        <Calendar className={`h-4 w-4 ${isUrgent ? 'text-destructive' : isWarning ? 'text-warning' : 'text-primary'}`} />
        <AlertDescription className={`${isUrgent ? 'text-destructive-foreground' : isWarning ? 'text-warning-foreground' : 'text-primary-foreground'}`}>
          <div className="flex items-center justify-between">
            <span>
              Your free trial {isUrgent ? 'expires' : 'ends'} in{' '}
              <strong>{trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}</strong>
            </span>
            {showUpgradeButton && (
              <Button
                size="sm"
                onClick={handleUpgrade}
                className="ml-4"
                variant={isUrgent ? 'destructive' : 'default'}
              >
                Upgrade Now
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`${isUrgent ? 'border-destructive/50 bg-destructive/10' : isWarning ? 'border-warning/50 bg-warning/10' : 'border-primary/50 bg-primary/10'} ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUrgent ? 'bg-destructive/20' : isWarning ? 'bg-warning/20' : 'bg-primary/20'}`}>
                {isUrgent ? (
                  <AlertTriangle className={`w-5 h-5 text-destructive`} />
                ) : (
                  <Gift className={`w-5 h-5 ${isWarning ? 'text-warning' : 'text-primary'}`} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    Free Trial Active
                  </h3>
                  <Badge variant={isUrgent ? 'destructive' : isWarning ? 'secondary' : 'default'}>
                    {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isUrgent 
                    ? 'Your trial expires soon! Upgrade now to continue using Storefy.'
                    : isWarning
                    ? 'Your trial is ending soon. Choose a plan to continue.'
                    : 'Enjoying Storefy? Upgrade to unlock more features and continue after your trial.'
                  }
                </p>
              </div>
            </div>
            {showUpgradeButton && (
              <Button
                onClick={handleUpgrade}
                variant={isUrgent ? 'destructive' : 'default'}
              >
                Upgrade Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default banner variant
  return (
    <div className={`${isUrgent ? 'bg-destructive' : isWarning ? 'bg-warning' : 'bg-primary'} text-primary-foreground px-4 py-3 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
            <span className="font-medium">
              {isUrgent ? 'Trial Expiring Soon!' : 'Free Trial Active'}
            </span>
          </div>
          <span className="text-sm opacity-90">
            {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
          </span>
        </div>
        {showUpgradeButton && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUpgrade}
          >
            <Zap className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        )}
      </div>
    </div>
  );
}

export function TrialStatusCard() {
  const { accessStatus } = useAccessControl();
  const { isTrialing, trialDaysRemaining } = useSubscription();
  const navigate = useNavigate();

  if (!isTrialing || !accessStatus) {
    return null;
  }

  const progressPercentage = Math.max(0, (30 - (30 - trialDaysRemaining)) / 30 * 100);

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Free Trial</h3>
          </div>
          <Badge className="bg-primary/10 text-primary">
            {trialDaysRemaining} days left
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Trial Progress</span>
            <span className="text-muted-foreground">{30 - trialDaysRemaining}/30 days used</span>
          </div>

          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${100 - progressPercentage}%` }}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            You're currently on a <strong>Free Trial</strong> with starter plan features.
            Upgrade anytime to unlock more features and continue using Storefy.
          </p>

          <Button
            onClick={() => navigate('/subscription?tab=plans')}
            className="w-full"
          >
            View Upgrade Options
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
