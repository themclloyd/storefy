import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Search,
  ChevronDown,
  Calendar,
  CreditCard,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useCurrentStore } from '@/stores/storeStore';
import { useStoreData } from '@/hooks/useSupabaseClient';
import { useExpenseStore } from '@/stores/expenseStore';
import { cn } from '@/lib/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  onClick?: () => void;
}

interface ChartPeriod {
  label: string;
  value: 'daily' | 'weekly' | 'monthly';
}

function MetricCard({ title, value, subtitle, change, icon: Icon, color = 'bg-muted', onClick }: MetricCardProps) {
  const changeColor = change && change > 0 ? 'text-primary' : change && change < 0 ? 'text-destructive' : 'text-muted-foreground';
  const ChangeIcon = change && change > 0 ? TrendingUp : change && change < 0 ? TrendingDown : null;

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow h-40" onClick={onClick}>
      <CardContent className="p-6 h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex flex-col justify-between h-full">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{title}</p>
              <p className="text-3xl font-bold mb-1">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 text-sm', changeColor)}>
                {ChangeIcon && <ChangeIcon className="h-4 w-4" />}
                <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-full', color)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TopSellingItemProps {
  name: string;
  orders: number;
  icon: React.ComponentType<{ className?: string }>;
}

function TopSellingItem({ name, orders, icon: Icon }: TopSellingItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
      <div className="p-2 bg-muted rounded-full">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">Order: {orders}</p>
      </div>
    </div>
  );
}

export function SimpleFocusedDashboard({ onViewChange }: DashboardProps) {
  const { currentStore } = useCurrentStore();
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Get store data
  const {
    data: storeData,
    loading,
    error,
    refetch
  } = useStoreData(currentStore?.id);

  // Get expense data
  const { expenses, fetchExpenses } = useExpenseStore();

  // Fetch expenses when store changes
  useEffect(() => {
    if (currentStore?.id) {
      fetchExpenses(currentStore.id);
    }
  }, [currentStore?.id, fetchExpenses]);

  // Calculate comprehensive stats using REAL store data
  const stats = React.useMemo(() => {
    if (!storeData) {
      return {
        todaySales: 0,
        todayOrders: 0,
        todayLayby: 0,
        inventoryValue: 0,
        totalExpenses: 0,
        todayExpenses: 0,
        profit: 0,
        profitMargin: 0,
        topSellingItems: [],
        chartData: [],
        previousDayComparison: {
          salesChange: 0,
          ordersChange: 0,
          laybyChange: 0
        }
      };
    }

    const { transactions = [], inventory = [], laybys = [] } = storeData;
    const today = new Date();
    const yesterday = subDays(today, 1);
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    // Filter transactions for today and yesterday
    const todayTransactions = transactions.filter((t: any) => {
      if (!t.created_at) return false;
      const transactionDate = new Date(t.created_at);
      return transactionDate >= todayStart && transactionDate <= todayEnd;
    });

    const yesterdayTransactions = transactions.filter((t: any) => {
      if (!t.created_at) return false;
      const transactionDate = new Date(t.created_at);
      return transactionDate >= yesterdayStart && transactionDate <= yesterdayEnd;
    });

    // Filter laybys for today and yesterday
    const todayLaybys = laybys.filter((l: any) => {
      if (!l.created_at) return false;
      const laybyDate = new Date(l.created_at);
      return laybyDate >= todayStart && laybyDate <= todayEnd;
    });

    const yesterdayLaybys = laybys.filter((l: any) => {
      if (!l.created_at) return false;
      const laybyDate = new Date(l.created_at);
      return laybyDate >= yesterdayStart && laybyDate <= yesterdayEnd;
    });

    // Filter expenses for today
    const todayExpenses = expenses.filter((e: any) => {
      if (!e.expense_date) return false;
      const expenseDate = new Date(e.expense_date);
      return expenseDate >= todayStart && expenseDate <= todayEnd;
    });

    // TODAY'S CALCULATIONS
    const todaySales = todayTransactions.reduce((sum: number, t: any) => sum + (parseFloat(t.total) || 0), 0);
    const todayOrders = todayTransactions.length;
    const todayLaybyValue = todayLaybys.reduce((sum: number, l: any) => sum + (parseFloat(l.total_amount) || 0), 0);
    const todayExpenseAmount = todayExpenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);

    // YESTERDAY'S CALCULATIONS FOR COMPARISON
    const yesterdaySales = yesterdayTransactions.reduce((sum: number, t: any) => sum + (parseFloat(t.total) || 0), 0);
    const yesterdayOrders = yesterdayTransactions.length;
    const yesterdayLaybyValue = yesterdayLaybys.reduce((sum: number, l: any) => sum + (parseFloat(l.total_amount) || 0), 0);

    // INVENTORY VALUE CALCULATION
    const inventoryValue = inventory.reduce((sum: number, item: any) => {
      const quantity = parseInt(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (quantity * price);
    }, 0);

    // TOTAL EXPENSES CALCULATION
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);

    // PROFIT CALCULATIONS
    const totalRevenue = transactions.reduce((sum: number, t: any) => sum + (parseFloat(t.total) || 0), 0);
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // PERCENTAGE CHANGES FROM YESTERDAY
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const salesChange = calculateChange(todaySales, yesterdaySales);
    const ordersChange = calculateChange(todayOrders, yesterdayOrders);
    const laybyChange = calculateChange(todayLaybyValue, yesterdayLaybyValue);

    // REAL TOP SELLING PRODUCTS: Analyze actual transaction data
    const productSales: Record<string, number> = {};

    transactions.forEach((transaction: any) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        // Count each item sold in the transaction
        transaction.items.forEach((item: any) => {
          const productName = item.name || item.product_name || item.title || 'Unknown Product';
          const quantity = parseInt(item.quantity) || 1;
          productSales[productName] = (productSales[productName] || 0) + quantity;
        });
      } else if (transaction.product_name) {
        // Handle transactions with direct product reference
        productSales[transaction.product_name] = (productSales[transaction.product_name] || 0) + 1;
      } else {
        // Fallback: use transaction description or generic name
        const productName = transaction.description || 'Sale Item';
        productSales[productName] = (productSales[productName] || 0) + 1;
      }
    });

    // Sort by sales volume and get top 4
    let topSellingItems = Object.entries(productSales)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 4)
      .map(([name, orders]) => ({
        name,
        orders: orders as number,
        icon: Package
      }));

    // If no transaction data, show inventory items with 0 sales
    if (topSellingItems.length === 0 && inventory.length > 0) {
      topSellingItems = inventory
        .slice(0, 4)
        .map((item: any) => ({
          name: item.name || item.title || 'Product',
          orders: 0,
          icon: Package
        }));
    }

    // If no inventory either, show placeholder
    if (topSellingItems.length === 0) {
      topSellingItems = [
        { name: 'No products yet', orders: 0, icon: Package }
      ];
    }

    // CHART DATA GENERATION (Last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayTransactions = transactions.filter((t: any) => {
        if (!t.created_at) return false;
        const transactionDate = new Date(t.created_at);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });

      const dayExpenses = expenses.filter((e: any) => {
        if (!e.expense_date) return false;
        const expenseDate = new Date(e.expense_date);
        return expenseDate >= dayStart && expenseDate <= dayEnd;
      });

      const sales = dayTransactions.reduce((sum: number, t: any) => sum + (parseFloat(t.total) || 0), 0);
      const expenseAmount = dayExpenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);

      chartData.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales,
        expenses: expenseAmount,
        profit: sales - expenseAmount,
        orders: dayTransactions.length
      });
    }

    return {
      todaySales,
      todayOrders,
      todayLayby: todayLaybyValue,
      inventoryValue,
      totalExpenses,
      todayExpenses: todayExpenseAmount,
      profit,
      profitMargin,
      topSellingItems,
      chartData,
      previousDayComparison: {
        salesChange,
        ordersChange,
        laybyChange
      }
    };
  }, [storeData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 space-y-8 max-w-7xl mx-auto">
        {/* Top Priority Metrics - Today's Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Today's Sales"
            value={formatCurrency(stats.todaySales)}
            subtitle="Revenue today"
            change={stats.previousDayComparison.salesChange}
            icon={DollarSign}
            color="bg-primary/10"
            onClick={() => onViewChange('reports')}
          />
          <MetricCard
            title="Today's Orders"
            value={stats.todayOrders.toString()}
            subtitle="Orders completed"
            change={stats.previousDayComparison.ordersChange}
            icon={ShoppingCart}
            color="bg-muted"
            onClick={() => onViewChange('orders')}
          />
          <MetricCard
            title="Layby Value"
            value={formatCurrency(stats.todayLayby)}
            subtitle="Today's laybys"
            change={stats.previousDayComparison.laybyChange}
            icon={CreditCard}
            color="bg-secondary/20"
            onClick={() => onViewChange('laybys')}
          />
          <MetricCard
            title="Inventory Value"
            value={formatCurrency(stats.inventoryValue)}
            subtitle="Stock on hand"
            icon={Package}
            color="bg-accent/20"
            onClick={() => onViewChange('inventory')}
          />
        </div>

        {/* Bottom Section - Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales vs Expenses Chart with Period Selector */}
          <Card className="h-96">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sales vs Expenses
                </CardTitle>
                <Select value={chartPeriod} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setChartPeriod(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'sales' ? 'Sales' : name === 'expenses' ? 'Expenses' : 'Profit'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stackId="1"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stackId="2"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive))"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Profit/Loss Analysis */}
          <Card className="h-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {stats.profit >= 0 ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
                Financial Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profit/Loss Summary */}
              <div className="text-center p-6 rounded-lg bg-muted/50">
                <div className={cn(
                  "text-3xl font-bold mb-2",
                  stats.profit >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {stats.profit >= 0 ? "+" : ""}{formatCurrency(stats.profit)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.profit >= 0 ? "You're winning! 🎉" : "Need attention ⚠️"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Profit Margin: {stats.profitMargin.toFixed(1)}%
                </p>
              </div>

              {/* Key Metrics */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Expenses</span>
                  <span className="font-medium text-destructive">{formatCurrency(stats.totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Today's Expenses</span>
                  <span className="font-medium text-destructive">{formatCurrency(stats.todayExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Inventory Value</span>
                  <span className="font-medium">{formatCurrency(stats.inventoryValue)}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full"
                variant={stats.profit >= 0 ? "default" : "destructive"}
                onClick={() => onViewChange('expenses')}
              >
                {stats.profit >= 0 ? "View Details" : "Review Expenses"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onViewChange('inventory')}>
                See All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.topSellingItems.map((item, index) => (
                <TopSellingItem
                  key={index}
                  name={item.name}
                  orders={item.orders}
                  icon={item.icon}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
