import React, { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardErrorStateProps {
  error: string;
  onRetry?: () => void;
}

/**
 * Error state component for the Dashboard
 */
export const DashboardErrorState = memo(function DashboardErrorState({
  error,
  onRetry
}: DashboardErrorStateProps) {
  const handleRetry = useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Dashboard Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {error || 'Failed to load dashboard data. Please try again.'}
              </p>
              {onRetry && (
                <Button onClick={handleRetry} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

DashboardErrorState.displayName = 'DashboardErrorState';
