import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { dashboardDesign, responsiveSpacing, touchFriendly } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showChart?: boolean;
  chartData?: number[];
  onClick?: () => void;
  onViewDetails?: () => void;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  color = 'primary',
  size = 'md',
  showChart = false,
  chartData = [],
  onClick,
  onViewDetails,
  loading = false,
  className
}: MetricCardProps) {
  const isInteractive = onClick || onViewDetails;
  
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400';
      case 'down':
        return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return {
          gradient: dashboardDesign.colors.gradients.success,
          icon: 'text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400'
        };
      case 'warning':
        return {
          gradient: dashboardDesign.colors.gradients.warning,
          icon: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400'
        };
      case 'danger':
        return {
          gradient: dashboardDesign.colors.gradients.danger,
          icon: 'text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400'
        };
      default:
        return {
          gradient: dashboardDesign.colors.gradients.primary,
          icon: 'text-primary bg-primary/10'
        };
    }
  };

  const colorClasses = getColorClasses(color);
  const TrendIcon = change ? getTrendIcon(change.trend) : null;

  const cardSizes = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const valueSizes = {
    sm: 'text-xl sm:text-2xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl'
  };

  if (loading) {
    return (
      <Card className={cn(
        dashboardDesign.cards.elevated,
        cardSizes[size],
        className
      )}>
        <CardContent className="p-0">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-8 w-8 bg-muted rounded-lg"></div>
            </div>
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="h-3 bg-muted rounded w-20"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        isInteractive ? dashboardDesign.cards.interactive : dashboardDesign.cards.metric,
        cardSizes[size],
        colorClasses.gradient,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className={cn(
              dashboardDesign.hierarchy.body,
              "font-medium mb-1"
            )}>
              {title}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {Icon && (
              <div className={cn(
                "p-2 rounded-lg",
                colorClasses.icon
              )}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className={cn(
                  "h-8 w-8 p-0 opacity-0 group-hover:opacity-100",
                  dashboardDesign.animations.smooth
                )}
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Value Display */}
        <div className="mb-4">
          <div className={cn(
            "font-bold text-foreground",
            valueSizes[size]
          )}>
            {value}
          </div>
        </div>

        {/* Change Indicator and Chart */}
        <div className="flex items-center justify-between">
          {change && (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs px-2 py-1",
                  getTrendColor(change.trend)
                )}
              >
                {TrendIcon && <TrendIcon className="h-3 w-3 mr-1" />}
                {change.value > 0 ? '+' : ''}{change.value}%
              </Badge>
              <span className="text-xs text-muted-foreground">
                vs {change.period}
              </span>
            </div>
          )}

          {showChart && chartData.length > 0 && (
            <div className="flex items-end gap-1 h-8">
              {chartData.slice(-8).map((value, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1 bg-primary/60 rounded-sm",
                    dashboardDesign.animations.smooth
                  )}
                  style={{
                    height: `${Math.max(4, (value / Math.max(...chartData)) * 32)}px`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        {isInteractive && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-between text-xs",
                dashboardDesign.animations.smooth
              )}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.();
              }}
            >
              View Details
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized metric card variants
export function RevenueCard(props: Omit<MetricCardProps, 'color' | 'icon'>) {
  return (
    <MetricCard
      {...props}
      color="success"
      icon={TrendingUp}
    />
  );
}

export function OrdersCard(props: Omit<MetricCardProps, 'color' | 'icon'>) {
  return (
    <MetricCard
      {...props}
      color="primary"
      icon={ArrowUpRight}
    />
  );
}

export function CustomersCard(props: Omit<MetricCardProps, 'color' | 'icon'>) {
  return (
    <MetricCard
      {...props}
      color="info"
      icon={TrendingUp}
    />
  );
}

// Metric cards grid container
interface MetricCardsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function MetricCardsGrid({ children, className }: MetricCardsGridProps) {
  return (
    <div className={cn(
      dashboardDesign.layouts.metrics,
      className
    )}>
      {children}
    </div>
  );
}
