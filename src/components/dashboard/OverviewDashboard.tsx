import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  Activity,
  BarChart3,
  PieChart,
  Target,
  Package,
  CreditCard,
  DollarSign,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalyticsMetrics {
  // Sales Analytics
  todaysSales: number;
  salesGrowth: number;

  // Layby Analytics
  activeLaybys: number;
  laybyValue: number;
  overdueLaybys: number;

  // Inventory Analytics
  totalProducts: number;
  lowStockItems: number;
  inventoryValue: number;
  inventoryGrowth: number;

  // Customer Analytics
  totalCustomers: number;
  newCustomersToday: number;
  customerGrowth: number;
  averageOrderValue: number;

  // Financial Analytics
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlySales: number;
  
  // Performance Data
  salesPerformanceData: Array<{
    date: string;
    sales: number;
    orders: number;
    completedOrders: number;
    pendingOrders: number;
    laybyOrders: number;
    laybyValue: number;
    averageOrderValue: number;
  }>;
  
  // Top Products
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    orders: number;
    revenue: number;
    growth: number;
  }>;
  
  // Recent Activity
  recentActivity: Array<{
    id: string;
    type: 'sale' | 'customer' | 'inventory';
    description: string;
    amount?: number;
    timestamp: string;
  }>;
}

export function OverviewDashboard() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [chartView, setChartView] = useState<'sales' | 'orders' | 'both'>('both');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    todaysSales: 0,
    salesGrowth: 0,
    activeLaybys: 0,
    laybyValue: 0,
    overdueLaybys: 0,
    totalProducts: 0,
    lowStockItems: 0,
    inventoryValue: 0,
    inventoryGrowth: 0,
    totalCustomers: 0,
    newCustomersToday: 0,
    customerGrowth: 0,
    averageOrderValue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    monthlySales: 0,
    salesPerformanceData: [],
    topProducts: [],
    recentActivity: []
  });

  useEffect(() => {
    if (currentStore) {
      fetchAnalyticsData();
    }
  }, [currentStore]);

  useEffect(() => {
    if (currentStore) {
      fetchPerformanceData();
    }
  }, [currentStore, selectedPeriod]);

  // Function to create sample data if store has no data
  const createSampleDataIfNeeded = async () => {
    if (!currentStore || !user) return;

    try {
      // Check if store has any orders
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', currentStore.id)
        .limit(1);

      if (existingOrders && existingOrders.length > 0) {
        return; // Store already has data
      }

      // Create sample customer
      const { data: sampleCustomer } = await supabase
        .from('customers')
        .insert({
          store_id: currentStore.id,
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          created_by: user.id
        })
        .select()
        .single();

      if (sampleCustomer) {
        // Create sample orders for the last 7 days
        const sampleOrders = [];
        for (let i = 0; i < 7; i++) {
          const orderDate = new Date();
          orderDate.setDate(orderDate.getDate() - i);

          const orderAmount = Math.floor(Math.random() * 500) + 50; // Random amount between 50-550

          sampleOrders.push({
            store_id: currentStore.id,
            customer_id: sampleCustomer.id,
            order_number: `ORD-${Date.now()}-${i}`,
            total: orderAmount,
            status: 'completed',
            created_at: orderDate.toISOString(),
            created_by: user.id
          });
        }

        await supabase.from('orders').insert(sampleOrders);

        // Create sample expense
        await supabase.from('expenses').insert({
          store_id: currentStore.id,
          title: 'Office Supplies',
          amount: 150,
          expense_date: new Date().toISOString().split('T')[0],
          payment_method: 'card',
          created_by: user.id
        });

        // Refresh data after creating samples
        setTimeout(() => {
          fetchAnalyticsData();
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating sample data:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    if (!currentStore) return;
    
    try {
      setLoading(true);
      await Promise.all([
        fetchSalesAnalytics(),
        fetchLaybyAnalytics(),
        fetchInventoryAnalytics(),
        fetchCustomerAnalytics(),
        fetchTopProducts(),
        fetchRecentActivity(),
        fetchPerformanceData()
      ]);

      // Fetch expenses after other data to calculate profit correctly
      await fetchExpenseAnalytics();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesAnalytics = async () => {
    if (!currentStore) return;

    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();

    // Today's sales
    const { data: todaysOrders } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('store_id', currentStore.id)
      .eq('status', 'completed')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    // Yesterday's sales
    const { data: yesterdaysOrders } = await supabase
      .from('orders')
      .select('total')
      .eq('store_id', currentStore.id)
      .eq('status', 'completed')
      .gte('created_at', yesterdayStart)
      .lte('created_at', yesterdayEnd);

    const todaysSales = todaysOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
    const yesterdaysSales = yesterdaysOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
    const salesGrowth = yesterdaysSales > 0 ? ((todaysSales - yesterdaysSales) / yesterdaysSales) * 100 : 0;

    const totalOrders = todaysOrders?.length || 0;
    const averageOrderValue = totalOrders > 0 ? todaysSales / totalOrders : 0;

    setMetrics(prev => ({
      ...prev,
      todaysSales,
      salesGrowth,
      averageOrderValue
    }));
  };

  const fetchLaybyAnalytics = async () => {
    if (!currentStore) return;

    try {
      // Get active laybys
      const { data: activeLaybysData } = await supabase
        .from('layby_orders')
        .select('id, total_amount, balance_remaining, due_date, status')
        .eq('store_id', currentStore.id)
        .in('status', ['active', 'partial']);

      const activeLaybys = activeLaybysData?.length || 0;
      const laybyValue = activeLaybysData?.reduce((sum, layby) => sum + Number(layby.balance_remaining), 0) || 0;

      // Check for overdue laybys
      const today = new Date().toISOString().split('T')[0];
      const overdueLaybys = activeLaybysData?.filter(layby =>
        layby.due_date && layby.due_date < today && layby.balance_remaining > 0
      ).length || 0;

      setMetrics(prev => ({
        ...prev,
        activeLaybys,
        laybyValue,
        overdueLaybys
      }));
    } catch (error) {
      console.error('Error fetching layby analytics:', error);
    }
  };

  const fetchInventoryAnalytics = async () => {
    if (!currentStore) return;

    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock_quantity, low_stock_threshold, price, cost')
      .eq('store_id', currentStore.id)
      .eq('is_active', true);

    if (!products) return;

    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.stock_quantity <= p.low_stock_threshold).length;
    const inventoryValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.cost || p.price || 0)), 0);

    setMetrics(prev => ({
      ...prev,
      totalProducts,
      lowStockItems,
      inventoryValue,
      inventoryGrowth: 0 // Could calculate based on historical data
    }));
  };

  const fetchCustomerAnalytics = async () => {
    if (!currentStore) return;

    try {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, created_at, total_spent')
        .eq('store_id', currentStore.id);

      if (!customers) return;

      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const yesterdayStart = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const totalCustomers = customers.length;
      const newCustomersToday = customers.filter(c => new Date(c.created_at) >= todayStart).length;
      const newCustomersYesterday = customers.filter(c => {
        const createdAt = new Date(c.created_at);
        return createdAt >= yesterdayStart && createdAt <= yesterdayEnd;
      }).length;

      // Calculate growth compared to yesterday
      const customerGrowth = newCustomersYesterday > 0 ?
        ((newCustomersToday - newCustomersYesterday) / newCustomersYesterday) * 100 :
        newCustomersToday > 0 ? 100 : 0;

      setMetrics(prev => ({
        ...prev,
        totalCustomers,
        newCustomersToday,
        customerGrowth
      }));
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
    }
  };

  const fetchExpenseAnalytics = async () => {
    if (!currentStore) return;

    try {
      // Get current month's date range
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
      const lastDayStr = lastDayOfMonth.toISOString().split('T')[0];

      // Fetch expenses for the current month
      const { data: monthlyExpenses } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('store_id', currentStore.id)
        .gte('expense_date', firstDayStr)
        .lte('expense_date', lastDayStr);

      // Also get recurring expenses for this month
      const { data: recurringExpenses } = await supabase
        .from('recurring_expenses')
        .select('amount, frequency')
        .eq('store_id', currentStore.id)
        .eq('is_active', true);

      const monthlyExpenseTotal = monthlyExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      // Calculate monthly equivalent of recurring expenses
      const recurringMonthlyTotal = recurringExpenses?.reduce((sum, expense) => {
        let monthlyAmount = Number(expense.amount);
        switch (expense.frequency) {
          case 'quarterly':
            monthlyAmount = monthlyAmount / 3;
            break;
          case 'yearly':
            monthlyAmount = monthlyAmount / 12;
            break;
          default:
            monthlyAmount = monthlyAmount; // monthly
        }
        return sum + monthlyAmount;
      }, 0) || 0;

      const totalExpenses = monthlyExpenseTotal + recurringMonthlyTotal;

      // Get actual monthly sales data
      const { data: monthlySalesData } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', currentStore.id)
        .eq('status', 'completed')
        .gte('created_at', firstDayStr)
        .lte('created_at', lastDayStr);

      const actualMonthlySales = monthlySalesData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      setMetrics(prev => {
        // Calculate net profit (actual monthly sales - monthly expenses)
        const netProfit = actualMonthlySales - totalExpenses;

        // Calculate profit margin
        const profitMargin = actualMonthlySales > 0 ? (netProfit / actualMonthlySales) * 100 : 0;

        return {
          ...prev,
          totalExpenses,
          netProfit,
          profitMargin,
          monthlySales: actualMonthlySales
        };
      });
    } catch (error) {
      console.error('Error fetching expense analytics:', error);
    }
  };

  const fetchTopProducts = async () => {
    if (!currentStore) return;

    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        products!inner(name)
      `)
      .eq('products.store_id', currentStore.id);

    if (!orderItems) return;

    // Group by product and calculate metrics
    const productMetrics = orderItems.reduce((acc, item) => {
      const productId = item.product_id;
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: item.products.name,
          sales: 0,
          orders: 0,
          revenue: 0,
          growth: 0
        };
      }
      acc[productId].sales += item.quantity;
      acc[productId].orders += 1;
      acc[productId].revenue += item.quantity * item.price;
      return acc;
    }, {} as Record<string, any>);

    const topProducts = Object.values(productMetrics)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    setMetrics(prev => ({
      ...prev,
      topProducts
    }));
  };

  const fetchRecentActivity = async () => {
    if (!currentStore) return;

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, total, created_at, order_number')
      .eq('store_id', currentStore.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentActivity = recentOrders?.map(order => ({
      id: order.id,
      type: 'sale' as const,
      description: `Order ${order.order_number} completed`,
      amount: Number(order.total),
      timestamp: order.created_at
    })) || [];

    setMetrics(prev => ({
      ...prev,
      recentActivity
    }));
  };

  const fetchPerformanceData = async () => {
    if (!currentStore) return;

    try {
      let dateRange: Date[] = [];
      let dateFormat: Intl.DateTimeFormatOptions = {};

      // Generate date range based on selected period
      switch (selectedPeriod) {
        case '7days':
          dateRange = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date;
          }).reverse();
          dateFormat = { month: 'short', day: 'numeric' };
          break;
        case '30days':
          dateRange = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date;
          }).reverse();
          dateFormat = { month: 'short', day: 'numeric' };
          break;
        case '12months':
          dateRange = Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return date;
          }).reverse();
          dateFormat = { month: 'short', year: '2-digit' };
          break;
        default:
          dateRange = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date;
          }).reverse();
          dateFormat = { month: 'short', day: 'numeric' };
      }

      const performanceData = await Promise.all(
        dateRange.map(async (date, index) => {
          let startDate: Date, endDate: Date;

          if (selectedPeriod === '12months') {
            // For monthly data, get the whole month
            startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
          } else {
            // For daily data
            startDate = new Date(date.setHours(0, 0, 0, 0));
            endDate = new Date(date.setHours(23, 59, 59, 999));
          }

          const startStr = startDate.toISOString();
          const endStr = endDate.toISOString();

          // Fetch sales data
          const { data: salesData, error: salesError } = await supabase
            .from('orders')
            .select('total, created_at, order_number')
            .eq('store_id', currentStore.id)
            .eq('status', 'completed')
            .gte('created_at', startStr)
            .lte('created_at', endStr);

          if (salesError) {
            console.error('Error fetching sales data:', salesError);
          }

          // Fetch orders count (including all statuses for better insights)
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('id, status, created_at')
            .eq('store_id', currentStore.id)
            .gte('created_at', startStr)
            .lte('created_at', endStr);

          if (ordersError) {
            console.error('Error fetching orders data:', ordersError);
          }

          // Fetch layby data
          const { data: laybyData, error: laybyError } = await supabase
            .from('layby_orders')
            .select('id, total_amount, status, created_at')
            .eq('store_id', currentStore.id)
            .gte('created_at', startStr)
            .lte('created_at', endStr);

          if (laybyError) {
            console.error('Error fetching layby data:', laybyError);
          }

          const sales = salesData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
          const totalOrders = ordersData?.length || 0;
          const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0;
          const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0;
          const laybyOrders = laybyData?.length || 0;
          const laybyValue = laybyData?.reduce((sum, layby) => sum + Number(layby.total_amount), 0) || 0;

          return {
            date: date.toLocaleDateString('en-US', dateFormat),
            sales,
            orders: totalOrders,
            completedOrders,
            pendingOrders,
            laybyOrders,
            laybyValue,
            averageOrderValue: completedOrders > 0 ? sales / completedOrders : 0
          };
        })
      );

      console.log('Enhanced performance data:', performanceData);

      setMetrics(prev => ({
        ...prev,
        salesPerformanceData: performanceData
      }));
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth > 0;
    return (
      <div className={cn(
        "flex items-center gap-1 text-sm font-medium",
        isPositive ? "text-primary" : "text-destructive"
      )}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {Math.abs(growth)}%
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome Back, {user?.user_metadata?.full_name || 'User'} 👋
            </h1>
            <p className="text-sm text-muted-foreground">Business Overview</p>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card className="border-border h-[140px]">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(metrics.todaysSales)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Sales | Today</span>
                {formatGrowth(metrics.salesGrowth)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Laybys */}
        <Card className="border-border h-[140px]">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Laybys</CardTitle>
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {formatNumber(metrics.activeLaybys || 0)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Active | {formatCurrency(metrics.laybyValue || 0)} Total</span>
                <Badge variant={metrics.overdueLaybys > 0 ? "destructive" : "secondary"} className="text-xs">
                  {metrics.overdueLaybys > 0 ? `${metrics.overdueLaybys} Overdue` : 'On Track'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card className="border-border h-[140px]">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
              <Receipt className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(metrics.totalExpenses)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">This Month | vs Target</span>
                <Badge
                  variant={
                    metrics.monthlySales > 0 && metrics.totalExpenses > metrics.monthlySales * 0.7
                      ? "destructive"
                      : metrics.totalExpenses > metrics.monthlySales * 0.5
                        ? "outline"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {metrics.monthlySales > 0 && metrics.totalExpenses > metrics.monthlySales * 0.7
                    ? 'Over Budget'
                    : metrics.totalExpenses > metrics.monthlySales * 0.5
                      ? 'Near Limit'
                      : 'On Track'
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="border-border h-[140px]">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {formatNumber(metrics.totalCustomers)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total | {metrics.newCustomersToday} New Today</span>
                {formatGrowth(metrics.customerGrowth)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Two Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Enhanced Sales Performance Chart */}
        <Card className="border-border h-[280px]">
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Sales Performance</CardTitle>
              <div className="flex items-center gap-2">
                {/* Period Selector */}
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="text-xs border border-border rounded px-2 py-1 bg-background"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="12months">Last 12 Months</option>
                </select>

                {/* View Toggle */}
                <div className="flex border border-border rounded overflow-hidden">
                  <button
                    onClick={() => setChartView('sales')}
                    className={cn(
                      "px-2 py-1 text-xs transition-colors",
                      chartView === 'sales' ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                    )}
                  >
                    Sales
                  </button>
                  <button
                    onClick={() => setChartView('orders')}
                    className={cn(
                      "px-2 py-1 text-xs transition-colors",
                      chartView === 'orders' ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                    )}
                  >
                    Orders
                  </button>
                  <button
                    onClick={() => setChartView('both')}
                    className={cn(
                      "px-2 py-1 text-xs transition-colors",
                      chartView === 'both' ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                    )}
                  >
                    Both
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              {/* Enhanced Chart Area */}
              <div className="h-[160px] bg-muted/5 rounded-lg relative overflow-hidden border">
                {metrics.salesPerformanceData && metrics.salesPerformanceData.length > 0 ? (
                  <div className="absolute inset-2">
                    <div className="h-full w-full relative">
                      {/* Y-axis grid lines */}
                      <div className="absolute inset-0">
                        {[0, 25, 50, 75, 100].map((percent) => (
                          <div
                            key={percent}
                            className="absolute w-full border-t border-border/20"
                            style={{ bottom: `${percent}%` }}
                          />
                        ))}
                      </div>

                      {/* Chart bars */}
                      <div className="absolute inset-0 flex items-end justify-between px-1">
                        {metrics.salesPerformanceData.map((data, index) => {
                          const maxValue = chartView === 'sales'
                            ? Math.max(...metrics.salesPerformanceData.map(d => d.sales), 1)
                            : chartView === 'orders'
                            ? Math.max(...metrics.salesPerformanceData.map(d => d.orders), 1)
                            : Math.max(
                                Math.max(...metrics.salesPerformanceData.map(d => d.sales)),
                                Math.max(...metrics.salesPerformanceData.map(d => d.orders * 100))
                              );

                          const salesHeight = chartView !== 'orders'
                            ? Math.max((data.sales / maxValue) * 100, data.sales > 0 ? 2 : 0)
                            : 0;

                          const ordersHeight = chartView !== 'sales'
                            ? Math.max(((data.orders * (chartView === 'both' ? 100 : 1)) / maxValue) * 100, data.orders > 0 ? 2 : 0)
                            : 0;

                          return (
                            <div
                              key={index}
                              className="flex flex-col items-center gap-1 relative group cursor-pointer"
                              onMouseEnter={() => setHoveredBar(index)}
                              onMouseLeave={() => setHoveredBar(null)}
                            >
                              <div className="relative flex items-end gap-0.5">
                                {chartView !== 'orders' && (
                                  <div
                                    className="w-3 bg-primary rounded-t-sm transition-all duration-300 hover:bg-primary/80"
                                    style={{ height: `${salesHeight}%` }}
                                  />
                                )}
                                {chartView !== 'sales' && (
                                  <div
                                    className="w-3 bg-chart-2 rounded-t-sm transition-all duration-300 hover:bg-chart-2/80"
                                    style={{ height: `${ordersHeight}%` }}
                                  />
                                )}
                              </div>

                              <span className="text-xs text-muted-foreground truncate max-w-[40px]">
                                {data.date}
                              </span>

                              {/* Hover tooltip */}
                              {hoveredBar === index && (
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded-lg p-2 shadow-lg z-10 min-w-[120px]">
                                  <div className="text-xs space-y-1">
                                    <div className="font-medium">{data.date}</div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                                      <span>Sales: {formatCurrency(data.sales)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                                      <span>Orders: {data.orders}</span>
                                    </div>
                                    <div className="text-muted-foreground">
                                      Avg: {formatCurrency(data.averageOrderValue)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : loading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm">Loading performance data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No performance data available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Total Sales</div>
                  <div className="text-sm font-semibold text-primary">
                    {formatCurrency(metrics.salesPerformanceData?.reduce((sum, d) => sum + d.sales, 0) || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Orders</div>
                  <div className="text-sm font-semibold text-chart-2">
                    {metrics.salesPerformanceData?.reduce((sum, d) => sum + d.orders, 0) || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Avg Order</div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatCurrency(
                      (metrics.salesPerformanceData?.reduce((sum, d) => sum + d.averageOrderValue, 0) || 0) /
                      Math.max(metrics.salesPerformanceData?.length || 1, 1)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Monthly Profit/Loss */}
        <Card className="border-border h-[280px]">
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Monthly Profit/Loss</CardTitle>
              <Badge
                variant={metrics.profitMargin >= 10 ? "default" : metrics.profitMargin >= 0 ? "outline" : "destructive"}
                className="text-xs"
              >
                {metrics.profitMargin >= 10 ? 'Healthy' : metrics.profitMargin >= 0 ? 'Stable' : 'Needs Attention'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-3">
              {/* Net Profit Display with Gauge */}
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  {/* Background Circle */}
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="10"
                    />
                    {/* Profit/Loss Arc */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={metrics.profitMargin >= 0 ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
                      strokeWidth="10"
                      strokeDasharray={`${Math.abs(metrics.profitMargin) * 2.83} 283`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xs text-muted-foreground">Net Profit</div>
                    <div className={cn("text-xl font-bold", metrics.netProfit >= 0 ? "text-accent" : "text-destructive")}>
                      {formatCurrency(metrics.netProfit)}
                    </div>
                    <div className={cn("text-xs", metrics.profitMargin >= 0 ? "text-accent" : "text-destructive")}>
                      {metrics.profitMargin.toFixed(1)}% margin
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Revenue</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Sales</span>
                    <span className="text-sm font-medium text-accent">{formatCurrency(metrics.monthlySales)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Laybys</span>
                    <span className="text-sm font-medium text-accent">
                      {formatCurrency(metrics.salesPerformanceData?.reduce((sum, d) => sum + d.laybyValue, 0) || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-xs font-medium">Total</span>
                    <span className="text-sm font-bold text-accent">
                      {formatCurrency(metrics.monthlySales + (metrics.salesPerformanceData?.reduce((sum, d) => sum + d.laybyValue, 0) || 0))}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Expenses</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Fixed</span>
                    <span className="text-sm font-medium text-destructive">
                      {formatCurrency(metrics.totalExpenses * 0.7)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Variable</span>
                    <span className="text-sm font-medium text-destructive">
                      {formatCurrency(metrics.totalExpenses * 0.3)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-xs font-medium">Total</span>
                    <span className="text-sm font-bold text-destructive">{formatCurrency(metrics.totalExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
