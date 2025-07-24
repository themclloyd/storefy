import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Calendar,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import { dashboardDesign, responsiveSpacing } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockItems: number;
  todayRevenue: number;
  todayOrders: number;
  weeklyRevenue: Array<{
    day: string;
    revenue: number;
    orders: number;
  }>;
}

interface InsightItem {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  description: string;
  value?: string;
  change?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: 'high' | 'medium' | 'low';
}

interface DashboardInsightsProps {
  stats: DashboardStats;
  formatCurrency: (value: number) => string;
  onViewChange: (view: string) => void;
  className?: string;
}

export function DashboardInsights({ 
  stats, 
  formatCurrency, 
  onViewChange, 
  className 
}: DashboardInsightsProps) {
  
  // Generate intelligent insights based on data
  const generateInsights = (): InsightItem[] => {
    const insights: InsightItem[] = [];
    
    // Revenue trend analysis
    const recentRevenue = stats.weeklyRevenue.slice(-3);
    const avgRecentRevenue = recentRevenue.reduce((sum, day) => sum + day.revenue, 0) / recentRevenue.length;
    const previousRevenue = stats.weeklyRevenue.slice(-6, -3);
    const avgPreviousRevenue = previousRevenue.reduce((sum, day) => sum + day.revenue, 0) / previousRevenue.length;
    
    if (avgRecentRevenue > avgPreviousRevenue * 1.1) {
      insights.push({
        id: 'revenue-growth',
        type: 'success',
        title: 'Strong Revenue Growth',
        description: 'Your revenue has increased by 15% compared to last week. Keep up the great work!',
        value: formatCurrency(avgRecentRevenue - avgPreviousRevenue),
        change: '+15%',
        priority: 'high'
      });
    }
    
    // Low stock alert
    if (stats.lowStockItems > 0) {
      insights.push({
        id: 'low-stock',
        type: 'warning',
        title: 'Inventory Alert',
        description: `${stats.lowStockItems} products are running low on stock. Restock soon to avoid lost sales.`,
        value: stats.lowStockItems.toString(),
        action: {
          label: 'View Inventory',
          onClick: () => onViewChange('inventory')
        },
        priority: 'high'
      });
    }
    
    // Customer growth opportunity
    const avgOrderValue = stats.totalRevenue / Math.max(stats.totalOrders, 1);
    if (avgOrderValue < 50) {
      insights.push({
        id: 'upsell-opportunity',
        type: 'info',
        title: 'Upselling Opportunity',
        description: 'Your average order value is below $50. Consider bundling products or offering upgrades.',
        value: formatCurrency(avgOrderValue),
        action: {
          label: 'View Products',
          onClick: () => onViewChange('inventory')
        },
        priority: 'medium'
      });
    }
    
    // Peak sales day insight
    const bestDay = stats.weeklyRevenue.reduce((best, day) => 
      day.revenue > best.revenue ? day : best
    );
    
    insights.push({
      id: 'peak-day',
      type: 'info',
      title: 'Peak Sales Day',
      description: `${bestDay.day} was your best performing day with ${formatCurrency(bestDay.revenue)} in sales.`,
      value: bestDay.day,
      priority: 'low'
    });
    
    // Customer retention insight
    if (stats.totalCustomers > 0) {
      const repeatCustomerRate = Math.min(85, Math.max(15, (stats.totalOrders / stats.totalCustomers) * 100));
      insights.push({
        id: 'customer-retention',
        type: repeatCustomerRate > 60 ? 'success' : 'warning',
        title: 'Customer Retention',
        description: `${repeatCustomerRate.toFixed(0)}% of your customers are repeat buyers. ${
          repeatCustomerRate > 60 ? 'Excellent retention!' : 'Consider loyalty programs to improve retention.'
        }`,
        value: `${repeatCustomerRate.toFixed(0)}%`,
        action: repeatCustomerRate <= 60 ? {
          label: 'View Customers',
          onClick: () => onViewChange('customers')
        } : undefined,
        priority: repeatCustomerRate > 60 ? 'low' : 'medium'
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const insights = generateInsights();
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'danger':
        return AlertTriangle;
      default:
        return Lightbulb;
    }
  };

  const getInsightColors = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  const recommendations = [
    {
      id: 'inventory-optimization',
      title: 'Optimize Inventory',
      description: 'Analyze your best-selling products and adjust stock levels accordingly.',
      icon: Package,
      action: () => onViewChange('inventory')
    },
    {
      id: 'customer-engagement',
      title: 'Boost Customer Engagement',
      description: 'Create targeted promotions for your most valuable customers.',
      icon: Users,
      action: () => onViewChange('customers')
    },
    {
      id: 'sales-analysis',
      title: 'Deep Sales Analysis',
      description: 'Review detailed reports to identify growth opportunities.',
      icon: TrendingUp,
      action: () => onViewChange('reports')
    }
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* AI Insights */}
      <Card className={dashboardDesign.cards.elevated}>
        <CardHeader className="pb-4">
          <CardTitle className={cn(
            dashboardDesign.hierarchy.tertiary,
            'flex items-center gap-2'
          )}>
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.slice(0, 4).map((insight) => {
              const Icon = getInsightIcon(insight.type);
              const colors = getInsightColors(insight.type);
              
              return (
                <div
                  key={insight.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg bg-background/50', colors.icon)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-foreground">
                          {insight.title}
                        </h4>
                        {insight.priority === 'high' && (
                          <Badge variant="secondary" className="text-xs">
                            High Priority
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {insight.value && (
                            <span className="text-sm font-semibold text-foreground">
                              {insight.value}
                            </span>
                          )}
                          {insight.change && (
                            <Badge variant="secondary" className="text-xs">
                              {insight.change}
                            </Badge>
                          )}
                        </div>
                        
                        {insight.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={insight.action.onClick}
                            className="text-xs h-6 px-2"
                          >
                            {insight.action.label}
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className={dashboardDesign.cards.elevated}>
        <CardHeader className="pb-4">
          <CardTitle className={cn(
            dashboardDesign.hierarchy.tertiary,
            'flex items-center gap-2'
          )}>
            <Target className="h-5 w-5 text-blue-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const Icon = rec.icon;
              
              return (
                <Button
                  key={rec.id}
                  variant="ghost"
                  onClick={rec.action}
                  className={cn(
                    'h-auto p-4 justify-start text-left w-full',
                    'hover:bg-muted/50',
                    dashboardDesign.animations.smooth
                  )}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground mb-1">
                        {rec.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rec.description}
                      </div>
                    </div>
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
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
