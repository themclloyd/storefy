import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  ShoppingCart,
  Users,
  Package,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Zap,
  Target,
  DollarSign
} from 'lucide-react';
import { dashboardDesign, responsiveSpacing, touchFriendly } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  count?: number;
  urgent?: boolean;
  onClick: () => void;
}

interface QuickActionsPanelProps {
  onViewChange: (view: string) => void;
  className?: string;
}

export function QuickActionsPanel({ onViewChange, className }: QuickActionsPanelProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'new-sale',
      label: 'New Sale',
      description: 'Start a new transaction',
      icon: Plus,
      color: 'primary',
      onClick: () => onViewChange('pos')
    },
    {
      id: 'add-product',
      label: 'Add Product',
      description: 'Add new inventory item',
      icon: Package,
      color: 'success',
      onClick: () => onViewChange('inventory')
    },
    {
      id: 'add-customer',
      label: 'Add Customer',
      description: 'Register new customer',
      icon: Users,
      color: 'info',
      onClick: () => onViewChange('customers')
    },
    {
      id: 'view-reports',
      label: 'View Reports',
      description: 'Analytics & insights',
      icon: TrendingUp,
      color: 'primary',
      onClick: () => onViewChange('reports')
    }
  ];

  const urgentTasks: QuickAction[] = [
    {
      id: 'low-stock',
      label: 'Low Stock Items',
      description: '5 items need restocking',
      icon: AlertTriangle,
      color: 'warning',
      count: 5,
      urgent: true,
      onClick: () => onViewChange('inventory')
    },
    {
      id: 'pending-orders',
      label: 'Pending Orders',
      description: '3 orders awaiting processing',
      icon: Clock,
      color: 'danger',
      count: 3,
      urgent: true,
      onClick: () => onViewChange('orders')
    }
  ];

  const shortcuts = [
    {
      id: 'daily-sales',
      label: 'Today\'s Sales',
      value: '$1,234.56',
      icon: DollarSign,
      trend: '+12%',
      onClick: () => onViewChange('reports')
    },
    {
      id: 'sales-target',
      label: 'Monthly Target',
      value: '68%',
      icon: Target,
      trend: 'On track',
      onClick: () => onViewChange('reports')
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30',
          icon: 'text-green-600 dark:text-green-400',
          border: 'border-green-200 dark:border-green-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30',
          icon: 'text-yellow-600 dark:text-yellow-400',
          border: 'border-yellow-200 dark:border-yellow-800'
        };
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30',
          icon: 'text-red-600 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30',
          icon: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800'
        };
      default:
        return {
          bg: 'bg-primary/5 hover:bg-primary/10',
          icon: 'text-primary',
          border: 'border-primary/20'
        };
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Actions */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const colors = getColorClasses(action.color);
              
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  onClick={action.onClick}
                  className={cn(
                    'h-auto p-4 justify-start text-left',
                    colors.bg,
                    colors.border,
                    'border',
                    dashboardDesign.animations.smooth,
                    touchFriendly.minTouch
                  )}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={cn(
                      'p-2 rounded-lg bg-background/50',
                      colors.icon
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground">
                        {action.label}
                      </div>
                      {action.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </div>
                      )}
                    </div>
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Urgent Tasks */}
      {urgentTasks.length > 0 && (
        <Card className={dashboardDesign.cards.elevated}>
          <CardHeader className="pb-4">
            <CardTitle className={cn(
              dashboardDesign.hierarchy.tertiary,
              'flex items-center gap-2'
            )}>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentTasks.map((task) => {
                const Icon = task.icon;
                const colors = getColorClasses(task.color);
                
                return (
                  <Button
                    key={task.id}
                    variant="ghost"
                    onClick={task.onClick}
                    className={cn(
                      'h-auto p-4 justify-start text-left w-full',
                      colors.bg,
                      colors.border,
                      'border',
                      dashboardDesign.animations.smooth,
                      touchFriendly.minTouch
                    )}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={cn(
                        'p-2 rounded-lg bg-background/50',
                        colors.icon
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">
                            {task.label}
                          </span>
                          {task.count && (
                            <Badge variant="secondary" className="text-xs">
                              {task.count}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card className={dashboardDesign.cards.elevated}>
        <CardHeader className="pb-4">
          <CardTitle className={cn(
            dashboardDesign.hierarchy.tertiary,
            'flex items-center gap-2'
          )}>
            <TrendingUp className="h-5 w-5 text-green-500" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              
              return (
                <Button
                  key={shortcut.id}
                  variant="ghost"
                  onClick={shortcut.onClick}
                  className={cn(
                    'h-auto p-4 justify-start text-left w-full',
                    'hover:bg-muted/50',
                    dashboardDesign.animations.smooth,
                    touchFriendly.minTouch
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">
                        {shortcut.label}
                      </div>
                      <div className="font-semibold text-lg text-foreground">
                        {shortcut.value}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600 font-medium">
                        {shortcut.trend}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
