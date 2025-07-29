import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricCardProps } from '../types';

/**
 * Optimized MetricCard component with memoization for better performance
 */
export const MetricCard = memo(function MetricCard({ 
  title, 
  value, 
  subtitle, 
  change, 
  icon: Icon, 
  color = 'bg-muted', 
  onClick 
}: MetricCardProps) {
  // Memoize change color calculation
  const changeColor = useMemo(() => {
    if (change === undefined) return 'text-muted-foreground';
    return change > 0 
      ? 'text-emerald-600 dark:text-emerald-400' 
      : 'text-red-600 dark:text-red-400';
  }, [change]);

  // Memoize change icon
  const ChangeIcon = useMemo(() => {
    if (change === undefined) return null;
    return change > 0 ? TrendingUp : TrendingDown;
  }, [change]);

  // Memoize click handler
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  // Memoize formatted change value
  const formattedChange = useMemo(() => {
    if (change === undefined) return null;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  }, [change]);

  return (
    <Card
      className={cn(
        "group cursor-pointer",
        "border border-border/40 bg-card",
        "hover:border-primary/30 hover:shadow-md",
        "h-24 xs:h-28 sm:h-32 touch-target"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-3 xs:p-4 sm:p-4 h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex flex-col justify-between h-full min-w-0 flex-1">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground line-clamp-1 uppercase tracking-wide">
                {title}
              </p>
              <p className="text-base sm:text-lg lg:text-xl font-bold tracking-tight line-clamp-1 text-foreground">
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground/70 line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
            
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium', changeColor)}>
                {ChangeIcon && (
                  <ChangeIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                )}
                <span className="whitespace-nowrap">{formattedChange}</span>
                <span className="text-muted-foreground font-normal text-xs hidden xs:inline">
                  vs yesterday
                </span>
              </div>
            )}
          </div>
          
          <div className={cn(
            'p-2 xs:p-2.5 sm:p-3 rounded-lg flex-shrink-0',
            'bg-primary/10'
          )}>
            <Icon className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';
