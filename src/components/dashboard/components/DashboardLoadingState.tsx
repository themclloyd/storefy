import React, { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton component for metric cards
 */
const MetricCardSkeleton = memo(function MetricCardSkeleton() {
  return (
    <Card className="h-32 xs:h-36 sm:h-40">
      <CardContent className="p-3 xs:p-4 sm:p-6 h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex flex-col justify-between h-full min-w-0 flex-1">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-2 w-12" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * Skeleton component for chart cards
 */
const ChartCardSkeleton = memo(function ChartCardSkeleton() {
  return (
    <Card className="h-80 sm:h-96">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 sm:h-56 lg:h-64 w-full" />
      </CardContent>
    </Card>
  );
});

/**
 * Loading state component for the Dashboard with skeleton UI
 */
export const DashboardLoadingState = memo(function DashboardLoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>

        {/* Top Products Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

DashboardLoadingState.displayName = 'DashboardLoadingState';
