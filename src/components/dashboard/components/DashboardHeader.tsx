import React, { memo } from 'react';
import { RefreshIndicator } from './RefreshIndicator';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
}

/**
 * Clean, focused dashboard header component
 */
export const DashboardHeader = memo(function DashboardHeader({
  title = "Dashboard",
  subtitle = "Welcome back! Here's what's happening with your store today.",
  isRefreshing = false,
  lastUpdated = null,
  onRefresh
}: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <RefreshIndicator
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
      />
    </div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
