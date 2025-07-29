import React, { memo, useCallback } from 'react';
import { DollarSign, ShoppingCart, CreditCard, Package } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { DashboardStats, CurrencyFormatter, ViewChangeHandler } from '../types';

interface MetricsGridProps {
  stats: DashboardStats;
  formatCurrency: CurrencyFormatter;
  onViewChange: ViewChangeHandler;
}

/**
 * Grid of metric cards showing key dashboard statistics
 */
export const MetricsGrid = memo(function MetricsGrid({ 
  stats, 
  formatCurrency, 
  onViewChange 
}: MetricsGridProps) {
  // Memoize navigation handlers
  const handleReportsClick = useCallback(() => {
    onViewChange('reports');
  }, [onViewChange]);

  const handleOrdersClick = useCallback(() => {
    onViewChange('orders');
  }, [onViewChange]);

  const handleLaybysClick = useCallback(() => {
    onViewChange('laybys');
  }, [onViewChange]);

  const handleInventoryClick = useCallback(() => {
    onViewChange('inventory');
  }, [onViewChange]);

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 animate-fade-in-up">
      <MetricCard
        title="Today's Sales"
        value={formatCurrency(stats.todaySales)}
        subtitle="Revenue today"
        change={stats.previousDayComparison.salesChange}
        icon={DollarSign}
        onClick={handleReportsClick}
      />
      
      <MetricCard
        title="Today's Orders"
        value={stats.todayOrders.toString()}
        subtitle="Orders completed"
        change={stats.previousDayComparison.ordersChange}
        icon={ShoppingCart}
        onClick={handleOrdersClick}
      />
      
      <MetricCard
        title="Layby Value"
        value={formatCurrency(stats.todayLayby)}
        subtitle="Today's laybys"
        change={stats.previousDayComparison.laybyChange}
        icon={CreditCard}
        onClick={handleLaybysClick}
      />
      
      <MetricCard
        title="Inventory Value"
        value={formatCurrency(stats.inventoryValue)}
        subtitle="Stock on hand"
        icon={Package}
        onClick={handleInventoryClick}
      />
    </div>
  );
});

MetricsGrid.displayName = 'MetricsGrid';
