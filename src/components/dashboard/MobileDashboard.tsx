import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { useScreenSize } from '@/hooks/use-mobile';
import { dashboardDesign, touchFriendly, responsiveSpacing } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';

interface MobileDashboardProps {
  stats: any;
  formatCurrency: (value: number) => string;
  onViewChange: (view: string) => void;
}

export function MobileDashboard({ stats, formatCurrency, onViewChange }: MobileDashboardProps) {
  const { isMobile } = useScreenSize();
  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'success',
      description: 'This month'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      change: '+8.2%',
      trend: 'up' as const,
      icon: ShoppingCart,
      color: 'primary',
      description: 'Orders processed'
    },
    {
      title: 'Customers',
      value: stats.totalCustomers.toLocaleString(),
      change: '+15.3%',
      trend: 'up' as const,
      icon: Users,
      color: 'info',
      description: 'Registered users'
    },
    {
      title: 'Products',
      value: stats.totalProducts.toLocaleString(),
      change: '+2.1%',
      trend: 'up' as const,
      icon: Package,
      color: 'warning',
      description: 'Active items'
    }
  ];

  const quickActions = [
    {
      id: 'new-sale',
      label: 'New Sale',
      icon: ShoppingCart,
      color: 'bg-green-500',
      action: () => onViewChange('pos')
    },
    {
      id: 'add-product',
      label: 'Add Product',
      icon: Package,
      color: 'bg-blue-500',
      action: () => onViewChange('inventory')
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      color: 'bg-purple-500',
      action: () => onViewChange('customers')
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: TrendingUp,
      color: 'bg-orange-500',
      action: () => onViewChange('reports')
    }
  ];

  const handleSwipeMetric = (direction: 'left' | 'right') => {
    if (direction === 'right' && currentMetricIndex < metrics.length - 1) {
      setCurrentMetricIndex(currentMetricIndex + 1);
    } else if (direction === 'left' && currentMetricIndex > 0) {
      setCurrentMetricIndex(currentMetricIndex - 1);
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

  if (!isMobile) {
    return null; // Only render on mobile
  }

  return (
    <div className="space-y-4 pb-20"> {/* Extra padding for mobile navigation */}
      {/* Hero Metric Card - Swipeable */}
      <Card className={cn(
        dashboardDesign.cards.metric,
        'relative overflow-hidden'
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSwipeMetric('left')}
              disabled={currentMetricIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-1">
              {metrics.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1.5 w-6 rounded-full transition-colors',
                    index === currentMetricIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSwipeMetric('right')}
              disabled={currentMetricIndex === metrics.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Metric Display */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-primary/10">
                {React.createElement(metrics[currentMetricIndex].icon, {
                  className: "h-6 w-6 text-primary"
                })}
              </div>
            </div>
            
            <h3 className="text-sm text-muted-foreground mb-1">
              {metrics[currentMetricIndex].title}
            </h3>
            
            <div className="text-3xl font-bold text-foreground mb-2">
              {metrics[currentMetricIndex].value}
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Badge className={getTrendColor(metrics[currentMetricIndex].trend)}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {metrics[currentMetricIndex].change}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {metrics[currentMetricIndex].description}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <Card className={dashboardDesign.cards.elevated}>
        <CardHeader className="pb-4">
          <CardTitle className={cn(
            dashboardDesign.hierarchy.tertiary,
            'flex items-center gap-2'
          )}>
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  onClick={action.action}
                  className={cn(
                    'h-20 flex-col gap-2 border border-border/50',
                    touchFriendly.minTouch,
                    dashboardDesign.animations.smooth
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg text-white',
                    action.color
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card className={dashboardDesign.cards.elevated}>
        <CardHeader className="pb-4">
          <CardTitle className={dashboardDesign.hierarchy.tertiary}>
            Today's Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Today's Revenue</p>
                  <p className="text-xs text-muted-foreground">Sales for today</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatCurrency(stats.todayRevenue)}</p>
                <p className="text-xs text-green-600">+12.8%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Today's Orders</p>
                  <p className="text-xs text-muted-foreground">Orders processed</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{stats.todayOrders}</p>
                <p className="text-xs text-blue-600">+5.2%</p>
              </div>
            </div>

            {stats.lowStockItems > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Low Stock Alert</p>
                    <p className="text-xs text-muted-foreground">Items need restocking</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">{stats.lowStockItems}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewChange('inventory')}
                    className="text-xs h-6 px-2"
                  >
                    View
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className={dashboardDesign.cards.elevated}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className={dashboardDesign.hierarchy.tertiary}>
              Recent Activity
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange('transactions')}
              className="text-xs"
            >
              View All
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentTransactions.slice(0, 3).map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{transaction.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.items} items • {transaction.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(transaction.amount)}</p>
                </div>
              </div>
            ))}
            {stats.recentTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent transactions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
