import React, { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import type { TopSellingItem } from '../types';

interface TopSellingProductsCardProps {
  topSellingItems: TopSellingItem[];
  onViewChange: (view: string) => void;
}

interface TopSellingItemProps {
  name: string;
  orders: number;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Individual top selling item component
 */
const TopSellingItemComponent = memo(function TopSellingItemComponent({
  name,
  orders,
  icon: Icon
}: TopSellingItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm line-clamp-1 text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">
            {orders} {orders === 1 ? 'order' : 'orders'}
          </p>
        </div>
      </div>
    </div>
  );
});

TopSellingItemComponent.displayName = 'TopSellingItemComponent';

/**
 * Top selling products card component
 */
export const TopSellingProductsCard = memo(function TopSellingProductsCard({
  topSellingItems,
  onViewChange
}: TopSellingProductsCardProps) {
  const { isMobile, isTablet } = useResponsive();

  const handleSeeAllClick = useCallback(() => {
    onViewChange('inventory');
  }, [onViewChange]);

  // Responsive grid columns
  const gridCols = isMobile
    ? "grid-cols-1"
    : isTablet
    ? "grid-cols-2"
    : "grid-cols-2 lg:grid-cols-4";

  return (
    <Card className="border border-border/40 bg-card shadow-sm">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <span className="line-clamp-1 text-foreground">
              Top Selling Products
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "sm"}
            onClick={handleSeeAllClick}
            className="w-full xs:w-auto hover:bg-primary/10"
          >
            See All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={cn("grid gap-3 sm:gap-4", gridCols)}>
          {topSellingItems.map((item, index) => (
            <TopSellingItemComponent
              key={index}
              name={item.name}
              orders={item.orders}
              icon={item.icon}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

TopSellingProductsCard.displayName = 'TopSellingProductsCard';
