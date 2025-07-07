import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTax } from "@/hooks/useTax";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Target, 
  Zap, 
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  ArrowRight,
  Plus,
  Eye,
  Settings,
  Download,
  RefreshCw,
  Filter,
  Search,
  Bell,
  Star,
  Award,
  Lightbulb,
  Rocket
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useState } from "react";
import { toast } from "sonner";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  handler: () => void;
  badge?: string | number;
  description?: string;
}

interface BusinessInsight {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  insight: string;
  action?: string;
}

interface PerformanceComparison {
  period: string;
  current: number;
  previous: number;
  metric: string;
  format: 'currency' | 'number' | 'percentage';
}

export function InteractiveBusinessWidgets() {
  const { currentStore } = useStore();
  const { formatCurrency } = useTax();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');

  const quickActions: QuickAction[] = [
    {
      id: 'pos',
      label: 'Open POS',
      icon: ShoppingCart,
      color: 'bg-primary text-primary-foreground',
      handler: () => window.location.href = '/pos',
      description: 'Start selling immediately'
    },
    {
      id: 'add-product',
      label: 'Add Product',
      icon: Plus,
      color: 'bg-primary text-primary-foreground',
      handler: () => window.location.href = '/inventory',
      description: 'Add new inventory item'
    },
    {
      id: 'restock',
      label: 'Restock Items',
      icon: Package,
      color: 'bg-warning text-warning-foreground',
      handler: () => window.location.href = '/inventory',
      badge: 5, // This would come from actual low stock count
      description: 'Restock low inventory'
    },
    {
      id: 'customer-insights',
      label: 'Customer Insights',
      icon: Users,
      color: 'bg-secondary text-secondary-foreground',
      handler: () => window.location.href = '/customers',
      description: 'View customer analytics'
    },
    {
      id: 'sales-report',
      label: 'Sales Report',
      icon: BarChart3,
      color: 'bg-success text-success-foreground',
      handler: () => window.location.href = '/reports',
      description: 'Generate sales report'
    },
    {
      id: 'set-targets',
      label: 'Set Targets',
      icon: Target,
      color: 'bg-destructive text-destructive-foreground',
      handler: () => toast.info('Target setting feature coming soon!'),
      description: 'Set sales targets'
    }
  ];

  const businessInsights: BusinessInsight[] = [
    {
      id: 'peak-hours',
      title: 'Peak Sales Hours',
      value: '11 AM - 2 PM',
      change: 15,
      trend: 'up',
      insight: 'Lunch hours show 15% higher sales',
      action: 'Optimize staffing'
    },
    {
      id: 'top-category',
      title: 'Top Category',
      value: 'Electronics',
      change: 23,
      trend: 'up',
      insight: '23% of total sales this week',
      action: 'Expand inventory'
    },
    {
      id: 'customer-retention',
      title: 'Customer Retention',
      value: '78%',
      change: -5,
      trend: 'down',
      insight: 'Retention down 5% this month',
      action: 'Launch loyalty program'
    },
    {
      id: 'avg-transaction',
      title: 'Avg Transaction',
      value: '$45.60',
      change: 8,
      trend: 'up',
      insight: 'Transaction value up 8%',
      action: 'Promote bundles'
    }
  ];

  const performanceComparisons: PerformanceComparison[] = [
    {
      period: 'Today vs Yesterday',
      current: 1250,
      previous: 1100,
      metric: 'Sales',
      format: 'currency'
    },
    {
      period: 'This Week vs Last Week',
      current: 45,
      previous: 38,
      metric: 'Orders',
      format: 'number'
    },
    {
      period: 'This Month vs Last Month',
      current: 15.5,
      previous: 12.8,
      metric: 'Profit Margin',
      format: 'percentage'
    }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const getChangeColor = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? 'text-success' : 'text-destructive';
  };

  const getChangeIcon = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? 
      <TrendingUp className="w-4 h-4" /> : 
      <TrendingUp className="w-4 h-4 rotate-180" />;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-destructive rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-muted-foreground rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Grid */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div key={action.id} className="relative">
                  <Button
                    onClick={action.handler}
                    className={`w-full h-20 flex flex-col items-center justify-center gap-2 ${action.color} hover:opacity-90 transition-all duration-200 hover:scale-105`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                  {action.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {action.badge}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Business Insights */}
      <Card className="card-professional">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Business Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedTimeframe === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('today')}
            >
              Today
            </Button>
            <Button
              variant={selectedTimeframe === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('week')}
            >
              Week
            </Button>
            <Button
              variant={selectedTimeframe === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('month')}
            >
              Month
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {businessInsights.map((insight) => (
              <div key={insight.id} className="p-4 bg-muted/20 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{insight.title}</h4>
                  {getTrendIcon(insight.trend)}
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-foreground">{insight.value}</p>
                  <p className="text-sm text-muted-foreground">{insight.insight}</p>
                  {insight.action && (
                    <Button variant="outline" size="sm" className="w-full">
                      {insight.action}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Comparisons */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Performance Comparisons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceComparisons.map((comparison, index) => {
              const change = ((comparison.current - comparison.previous) / comparison.previous) * 100;
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{comparison.period}</h4>
                    <p className="text-sm text-muted-foreground">{comparison.metric}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {formatValue(comparison.current, comparison.format)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        vs {formatValue(comparison.previous, comparison.format)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 ${getChangeColor(comparison.current, comparison.previous)}`}>
                      {getChangeIcon(comparison.current, comparison.previous)}
                      <span className="text-sm font-medium">
                        {Math.abs(change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Operational Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Rocket className="w-5 h-5 text-purple-500" />
              Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-400">
                  Inventory Optimization
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                Consider restocking Electronics category - high demand detected
              </p>
              <Button variant="outline" size="sm" className="text-success border-success/20">
                View Details
              </Button>
            </div>

            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Customer Engagement
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                3 customers qualify for VIP status upgrade
              </p>
              <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                Upgrade Now
              </Button>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-400">
                  Sales Opportunity
                </span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                Bundle promotion could increase average order value by 15%
              </p>
              <Button variant="outline" size="sm" className="text-purple-700 border-purple-300">
                Create Bundle
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="w-5 h-5 text-gray-500" />
              Quick Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export Today's Data
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Inventory
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Search className="w-4 h-4 mr-2" />
              Search Products
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Bell className="w-4 h-4 mr-2" />
              Notification Settings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
