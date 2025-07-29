import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  lastUpdated: Date | null;
  onRefresh?: () => void;
}

/**
 * Refresh indicator component showing data freshness and refresh status
 */
export const RefreshIndicator = memo(function RefreshIndicator({
  isRefreshing,
  lastUpdated,
  onRefresh
}: RefreshIndicatorProps) {
  const handleRefresh = () => {
    if (!isRefreshing && onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={cn(
          "p-1 rounded-md hover:bg-muted transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        title="Refresh data"
      >
        <RefreshCw 
          className={cn(
            "h-3 w-3",
            isRefreshing && "animate-spin"
          )} 
        />
      </button>
      
      {lastUpdated && (
        <span className="hidden sm:inline">
          Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </span>
      )}
      
      {isRefreshing && (
        <span className="text-primary">
          Updating...
        </span>
      )}
    </div>
  );
});

RefreshIndicator.displayName = 'RefreshIndicator';
