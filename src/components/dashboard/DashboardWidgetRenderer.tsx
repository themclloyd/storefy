import React from 'react';
import { DashboardWidget } from '@/hooks/useDashboardLayout';
import { MetricCard, RevenueCard, OrdersCard, CustomersCard } from './MetricCard';
import { ModernAreaChart, ModernBarChart, ModernPieChart } from './ChartComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  PieChart
} from 'lucide-react';
import { dashboardDesign } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockItems: number;
  todayRevenue: number;
  todayOrders: number;
  recentTransactions: Array<{
    id: string;
    amount: number;
    customer: string;
    time: string;
    items: number;
  }>;
  salesByCategory: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  weeklyRevenue: Array<{
    day: string;
    revenue: number;
    orders: number;
  }>;
}

interface DashboardWidgetRendererProps {
  widget: DashboardWidget;
  stats: DashboardStats;
  formatCurrency: (value: number) => string;
  onViewChange: (view: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
}

export function DashboardWidgetRenderer({
  widget,
  stats,
  formatCurrency,
  onViewChange,
  onRefresh,
  onExport,
  className
}: DashboardWidgetRendererProps) {
  if (!widget.enabled) {
    return null;
  }

  const renderWidget = () => {
    switch (widget.id) {
      case 'revenue-metric':
        return (
          <RevenueCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            change={{
              value: 12.5,
              period: 'last month',
              trend: 'up'
            }}
            description="This month's total sales"
            showChart={true}
            chartData={stats.weeklyRevenue.map(d => d.revenue)}
            onViewDetails={() => onViewChange('reports')}
          />
        );

      case 'orders-metric':
        return (
          <OrdersCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            change={{
              value: 8.2,
              period: 'last month',
              trend: 'up'
            }}
            description="Orders processed"
            showChart={true}
            chartData={stats.weeklyRevenue.map(d => d.orders)}
            onViewDetails={() => onViewChange('orders')}
          />
        );

      case 'customers-metric':
        return (
          <CustomersCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            change={{
              value: 15.3,
              period: 'last month',
              trend: 'up'
            }}
            description="Registered customers"
            onViewDetails={() => onViewChange('customers')}
          />
        );

      case 'products-metric':
        return (
          <MetricCard
            title="Products"
            value={stats.totalProducts.toLocaleString()}
            icon={Package}
            color="info"
            description="Active inventory items"
            onViewDetails={() => onViewChange('inventory')}
          />
        );

      case 'low-stock-alert':
        return (
          <MetricCard
            title="Low Stock Alert"
            value={stats.lowStockItems}
            icon={AlertTriangle}
            color="warning"
            description="Items need restocking"
            onViewDetails={() => onViewChange('inventory')}
          />
        );

      case 'today-revenue':
        return (
          <MetricCard
            title="Today's Revenue"
            value={formatCurrency(stats.todayRevenue)}
            change={{
              value: 12.8,
              period: 'yesterday',
              trend: 'up'
            }}
            icon={TrendingUp}
            color="primary"
            description="Sales for today"
          />
        );

      case 'revenue-chart':
        const revenueChartData = stats.weeklyRevenue.map(item => ({
          name: item.day,
          revenue: item.revenue,
          orders: item.orders
        }));

        return (
          <ModernAreaChart
            title="Revenue Trend"
            subtitle="Daily revenue over the past week"
            data={revenueChartData}
            height={350}
            dataKey="revenue"
            xAxisKey="name"
            formatter={(value) => formatCurrency(value)}
            onExport={onExport}
            onRefresh={onRefresh}
          />
        );

      case 'category-chart':
        const categoryChartData = stats.salesByCategory.map(item => ({
          name: item.name,
          value: item.value,
          color: item.color
        }));

        return (
          <ModernPieChart
            title="Sales by Category"
            subtitle="Product category breakdown"
            data={categoryChartData}
            height={350}
            dataKey="value"
            nameKey="name"
            onExport={onExport}
          />
        );

      case 'orders-chart':
        const ordersChartData = stats.weeklyRevenue.map(item => ({
          name: item.day,
          orders: item.orders
        }));

        return (
          <ModernBarChart
            title="Orders Trend"
            subtitle="Daily orders over the past week"
            data={ordersChartData}
            height={300}
            dataKey="orders"
            xAxisKey="name"
            onExport={onExport}
            onRefresh={onRefresh}
          />
        );

      case 'recent-transactions':
        return (
          <Card className={dashboardDesign.cards.elevated}>
            <CardHeader className="pb-4">
              <CardTitle className={dashboardDesign.hierarchy.tertiary}>
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentTransactions.slice(0, 5).map((transaction) => (
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
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4"
                onClick={() => onViewChange('transactions')}
              >
                View All Transactions
                <ArrowUpRight className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        );

      case 'average-order-value':
        return (
          <MetricCard
            title="Average Order Value"
            value={stats.totalOrders > 0 ? formatCurrency(stats.totalRevenue / stats.totalOrders) : formatCurrency(0)}
            change={{
              value: 5.2,
              period: 'last month',
              trend: 'up'
            }}
            icon={DollarSign}
            color="success"
            description="Per transaction average"
          />
        );

      default:
        return (
          <Card className={dashboardDesign.cards.flat}>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Widget not found: {widget.name}</p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className={className}>
      {renderWidget()}
    </div>
  );
}

// Helper function to get grid span classes based on widget position
export function getWidgetGridClasses(widget: DashboardWidget): string {
  const { width, height } = widget.position;
  
  const spanClasses = [];
  
  // Column span
  if (width === 1) spanClasses.push('col-span-1');
  else if (width === 2) spanClasses.push('col-span-1 md:col-span-2');
  else if (width === 3) spanClasses.push('col-span-1 md:col-span-3');
  else if (width === 4) spanClasses.push('col-span-1 md:col-span-4');
  else spanClasses.push('col-span-full');
  
  // Row span (for height)
  if (height > 1) {
    spanClasses.push(`row-span-${height}`);
  }
  
  return spanClasses.join(' ');
}
