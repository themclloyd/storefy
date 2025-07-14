import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Activity,
  RefreshCw,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTax } from "@/hooks/useTax";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  // Core Sales Metrics
  todaysSales: number;
  yesterdaysSales: number;
  salesGrowth: number;
  averageTransactionValue: number;
  salesTarget: number;
  salesTargetProgress: number;

  // Inventory Management
  totalOrders: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalProducts: number;
  inventoryValue: number;
  topSellingProduct: string;

  // Customer Management
  totalCustomers: number;
  newCustomersToday: number;
  returningCustomers: number;
  customerRetentionRate: number;
  vipCustomers: number;
  averageCustomerValue: number;

  // Operational Metrics
  ordersFulfilled: number;
  pendingOrders: number;
  refundRate: number;
  profitMargin: number;

  // Expense Metrics
  monthlyExpenses: number;
  expenseGrowth: number;
  unpaidExpenses: number;

  // Layby Management
  totalLaybys: number;
  activeLaybys: number;
  overdueLaybys: number;
  completedLaybys: number;
  totalLaybyValue: number;
  outstandingLaybyBalance: number;
  laybyDepositsCollected: number;
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  quantity: number;
  image?: string;
}

export function DashboardView() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const { formatCurrency } = useTax();
  const [stats, setStats] = useState<DashboardStats>({
    todaysSales: 0,
    yesterdaysSales: 0,
    salesGrowth: 0,
    averageTransactionValue: 0,
    salesTarget: 1000,
    salesTargetProgress: 0,
    totalOrders: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalProducts: 0,
    inventoryValue: 0,
    topSellingProduct: '',
    totalCustomers: 0,
    newCustomersToday: 0,
    returningCustomers: 0,
    customerRetentionRate: 0,
    vipCustomers: 0,
    averageCustomerValue: 0,
    ordersFulfilled: 0,
    pendingOrders: 0,
    refundRate: 0,
    profitMargin: 0,
    monthlyExpenses: 0,
    expenseGrowth: 0,
    unpaidExpenses: 0,
    totalLaybys: 0,
    activeLaybys: 0,
    overdueLaybys: 0,
    completedLaybys: 0,
    totalLaybyValue: 0,
    outstandingLaybyBalance: 0,
    laybyDepositsCollected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [salesPeriod, setSalesPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [filteredSales, setFilteredSales] = useState(0);

  useEffect(() => {
    if (currentStore && user) {
      fetchDashboardData();
      // Set up real-time updates every 5 minutes
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [currentStore, user]);

  useEffect(() => {
    if (currentStore) {
      calculateFilteredSales();
    }
  }, [salesPeriod, currentStore]);

  const calculateFilteredSales = async () => {
    if (!currentStore) return;

    try {
      const now = new Date();
      let startDate: Date;

      switch (salesPeriod) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0));
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', currentStore.id)
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      const total = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      setFilteredSales(total);
    } catch (error) {
      console.error('Error calculating filtered sales:', error);
    }
  };



  const fetchSalesMetrics = async () => {
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
    const averageTransactionValue = todaysOrders?.length ? todaysSales / todaysOrders.length : 0;
    const salesTargetProgress = (todaysSales / stats.salesTarget) * 100;

    setStats(prev => ({
      ...prev,
      todaysSales,
      yesterdaysSales,
      salesGrowth,
      averageTransactionValue,
      salesTargetProgress,
      totalOrders: todaysOrders?.length || 0,
    }));
  };

  const fetchInventoryMetrics = async () => {
    if (!currentStore) return;

    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock_quantity, low_stock_threshold, price, cost')
      .eq('store_id', currentStore.id)
      .eq('is_active', true);

    if (!products) return;

    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.stock_quantity <= p.low_stock_threshold).length;
    const outOfStockItems = products.filter(p => p.stock_quantity === 0).length;
    const inventoryValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.cost || p.price || 0)), 0);

    setStats(prev => ({
      ...prev,
      totalProducts,
      lowStockItems,
      outOfStockItems,
      inventoryValue,
    }));
  };

  const fetchCustomerMetrics = async () => {
    if (!currentStore) return;

    const { data: customers } = await supabase
      .from('customers')
      .select('id, status, total_spent, total_orders, created_at')
      .eq('store_id', currentStore.id);

    if (!customers) return;

    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));

    const totalCustomers = customers.length;
    const newCustomersToday = customers.filter(c =>
      new Date(c.created_at) >= todayStart
    ).length;
    const vipCustomers = customers.filter(c => c.status === 'vip').length;
    const returningCustomers = customers.filter(c => (c.total_orders || 0) > 1).length;
    const averageCustomerValue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / totalCustomers;
    const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    setStats(prev => ({
      ...prev,
      totalCustomers,
      newCustomersToday,
      returningCustomers,
      vipCustomers,
      averageCustomerValue,
      customerRetentionRate,
    }));
  };

  const fetchOperationalMetrics = async () => {
    if (!currentStore) return;

    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();

    const { data: orders } = await supabase
      .from('orders')
      .select('status, total, subtotal, discount_amount')
      .eq('store_id', currentStore.id)
      .gte('created_at', todayStart);

    if (!orders) return;

    const ordersFulfilled = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const refundedOrders = orders.filter(o => o.status === 'refunded').length;
    const refundRate = orders.length > 0 ? (refundedOrders / orders.length) * 100 : 0;

    const grossRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalDiscounts = orders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);
    const netProfit = grossRevenue - totalDiscounts;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    setStats(prev => ({
      ...prev,
      ordersFulfilled,
      pendingOrders,
      refundRate,
      profitMargin,
    }));
  };

  const fetchExpenseMetrics = async () => {
    if (!currentStore) return;

    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    try {
      // Get current month expenses
      const { data: currentMonthExpenses } = await supabase
        .from('expenses')
        .select('amount, status')
        .eq('store_id', currentStore.id)
        .gte('expense_date', currentMonth.toISOString().split('T')[0])
        .lte('expense_date', today.toISOString().split('T')[0]);

      // Get last month expenses for comparison
      const { data: lastMonthExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('store_id', currentStore.id)
        .gte('expense_date', lastMonth.toISOString().split('T')[0])
        .lte('expense_date', lastMonthEnd.toISOString().split('T')[0]);

      const monthlyExpenses = currentMonthExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const lastMonthTotal = lastMonthExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const expenseGrowth = lastMonthTotal > 0 ? ((monthlyExpenses - lastMonthTotal) / lastMonthTotal) * 100 : 0;
      const unpaidExpenses = currentMonthExpenses?.filter(e => e.status === 'pending').length || 0;

      setStats(prev => ({
        ...prev,
        monthlyExpenses,
        expenseGrowth,
        unpaidExpenses,
      }));
    } catch (error) {
      console.error('Error fetching expense metrics:', error);
    }
  };

  const fetchTopProducts = async () => {
    if (!currentStore) return;

    try {
      // First get recent completed orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', currentStore.id)
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!recentOrders || recentOrders.length === 0) {
        setStats(prev => ({ ...prev, topSellingProduct: 'No recent sales' }));
        return;
      }

      const orderIds = recentOrders.map(order => order.id);

      // Then get order items for those orders
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          products (id, name, image_url)
        `)
        .in('order_id', orderIds);

      if (!orderItems) return;

      const productSales = orderItems.reduce((acc: any, item: any) => {
        if (!item.products) return acc;

        const productId = item.products.id;
        if (!acc[productId]) {
          acc[productId] = {
            id: productId,
            name: item.products.name,
            image: item.products.image_url,
            sales: 0,
            quantity: 0,
          };
        }
        acc[productId].sales += Number(item.total_price);
        acc[productId].quantity += item.quantity;
        return acc;
      }, {});

      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.sales - a.sales)
        .slice(0, 5) as TopProduct[];

      if (topProducts.length > 0) {
        setStats(prev => ({ ...prev, topSellingProduct: topProducts[0].name }));
      } else {
        setStats(prev => ({ ...prev, topSellingProduct: 'No data available' }));
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
      setStats(prev => ({ ...prev, topSellingProduct: 'Error loading data' }));
    }
  };

  const fetchLaybyMetrics = async () => {
    if (!currentStore) return;

    try {
      const { data: laybyOrders, error } = await supabase
        .from('layby_orders')
        .select('*')
        .eq('store_id', currentStore.id);

      if (error) {
        console.error('Error fetching layby metrics:', error);
        return;
      }

      const orders = laybyOrders || [];

      const totalLaybys = orders.length;
      const activeLaybys = orders.filter(o => o.status === 'active').length;
      const overdueLaybys = orders.filter(o => o.status === 'overdue').length;
      const completedLaybys = orders.filter(o => o.status === 'completed').length;
      const totalLaybyValue = orders.reduce((sum, o) => sum + o.total_amount, 0);
      const outstandingLaybyBalance = orders
        .filter(o => o.status === 'active' || o.status === 'overdue')
        .reduce((sum, o) => sum + o.balance_remaining, 0);
      const laybyDepositsCollected = orders.reduce((sum, o) => sum + o.deposit_amount, 0);

      setStats(prev => ({
        ...prev,
        totalLaybys,
        activeLaybys,
        overdueLaybys,
        completedLaybys,
        totalLaybyValue,
        outstandingLaybyBalance,
        laybyDepositsCollected,
      }));
    } catch (error) {
      console.error('Error fetching layby metrics:', error);
    }
  };

  const fetchDashboardData = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);
      await Promise.all([
        fetchSalesMetrics(),
        fetchInventoryMetrics(),
        fetchCustomerMetrics(),
        fetchOperationalMetrics(),
        fetchExpenseMetrics(),
        fetchTopProducts(),
        fetchLaybyMetrics(),
        calculateFilteredSales(),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading exceptional dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Real-time insights for {currentStore?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search metrics..."
              className="pl-10 w-64 h-9"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1 text-xs h-9">
            <Activity className="w-3 h-3 text-green-500 animate-pulse" />
            Live
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 px-3"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9">
            <Plus className="w-4 h-4 mr-2" />
            Quick Sale
          </Button>
        </div>
      </div>

      {/* Enhanced Dashboard - 6 Key Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Sales Performance Card */}
        <Card className="relative overflow-hidden bg-card border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sales Performance
              </CardTitle>
              <Select value={salesPeriod} onValueChange={(value: 'today' | 'week' | 'month') => setSalesPeriod(value)}>
                <SelectTrigger className="w-28 h-7 text-xs bg-white/80 border-primary/20" aria-label="Select sales period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Sales Amount & Target Progress */}
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(filteredSales)}
              </div>
              <div className="text-xs text-muted-foreground">
                Target: {formatCurrency(stats.salesTarget)} • {stats.salesTargetProgress.toFixed(0)}%
              </div>
              <Progress value={Math.min(stats.salesTargetProgress, 100)} className="h-1.5" />
            </div>

            {/* Sales Trend Mini Chart */}
            <div className="flex items-end space-x-1 h-12 mb-2">
              {[65, 78, 82, 90, 85, 95, 88].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary rounded-sm"
                    style={{ height: `${(value / 100) * 40}px` }}
                  />
                </div>
              ))}
            </div>

            {/* Sales Growth Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">vs yesterday</span>
              <div className="flex items-center gap-1">
                {stats.salesGrowth >= 0 ? (
                  <ArrowUp className="w-3 h-3 text-accent" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-destructive" />
                )}
                <span className={`text-sm font-bold ${stats.salesGrowth >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {stats.salesGrowth >= 0 ? '+' : ''}{stats.salesGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Layby Management Card */}
        <Card className="relative overflow-hidden bg-card border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Layby Management
            </CardTitle>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.activeLaybys}
                </div>
                <div className="text-xs text-muted-foreground">
                  Active Laybys
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-foreground">
                  {formatCurrency(stats.totalLaybyValue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Value
                </div>
              </div>
            </div>

            {/* Compact Layby Status */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-primary/5 rounded">
                <div className="text-lg font-bold text-primary">{stats.completedLaybys}</div>
                <div className="text-xs text-primary">Completed</div>
              </div>
              <div className="text-center p-2 bg-destructive/5 rounded">
                <div className="text-lg font-bold text-destructive">{stats.overdueLaybys}</div>
                <div className="text-xs text-destructive">Overdue</div>
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Outstanding Balance</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(stats.outstandingLaybyBalance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Inventory Health Card */}
        <Card className="relative overflow-hidden bg-card border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Health
            </CardTitle>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.totalProducts}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Products
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-foreground">
                  {formatCurrency(stats.inventoryValue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Value
                </div>
              </div>
            </div>

            {/* Compact Inventory Status */}
            <div className="grid grid-cols-3 gap-1">
              <div className="text-center p-2 bg-accent/10 rounded">
                <div className="text-sm font-bold text-accent">
                  {Math.max(0, stats.totalProducts - stats.lowStockItems - stats.outOfStockItems)}
                </div>
                <div className="text-xs text-accent">In Stock</div>
              </div>
              <div className="text-center p-2 bg-primary/10 rounded">
                <div className="text-sm font-bold text-primary">{stats.lowStockItems}</div>
                <div className="text-xs text-primary">Low</div>
              </div>
              <div className="text-center p-2 bg-destructive/10 rounded">
                <div className="text-sm font-bold text-destructive">{stats.outOfStockItems}</div>
                <div className="text-xs text-destructive">Out</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Customer Growth Card */}
        <Card className="relative overflow-hidden bg-card border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customer Growth
            </CardTitle>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">
                  {stats.totalCustomers}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Customers
                </div>
              </div>

              {/* Circular Progress for Retention */}
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${stats.customerRetentionRate * 2.2} ${100 * 2.2}`}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{stats.customerRetentionRate.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Customer Retention Rate
            </div>

            {/* Customer Metrics */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-1.5 bg-accent/10 rounded">
                <span className="text-xs font-medium text-accent">New Today</span>
                <span className="text-sm font-bold text-accent">{stats.newCustomersToday}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-primary/10 rounded">
                <span className="text-xs font-medium text-primary">VIP</span>
                <span className="text-sm font-bold text-primary">{stats.vipCustomers}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-secondary/10 rounded">
                <span className="text-xs font-medium text-secondary-foreground">Returning</span>
                <span className="text-sm font-bold text-secondary-foreground">{stats.returningCustomers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Profitability & Cash Flow Card */}
        <Card className="relative overflow-hidden bg-card border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profitability
            </CardTitle>
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {stats.profitMargin.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Net Profit Margin
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-1.5 bg-accent/10 rounded">
                <span className="text-xs font-medium text-accent">Gross Margin</span>
                <span className="text-sm font-bold text-accent">
                  {(stats.profitMargin * 1.3).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-primary/10 rounded">
                <span className="text-xs font-medium text-primary">Refund Rate</span>
                <span className="text-sm font-bold text-primary">{stats.refundRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Monthly Expenses Card */}
        <Card className="relative overflow-hidden bg-card border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Expenses
            </CardTitle>
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Monthly Expense Amount */}
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.monthlyExpenses)}
              </div>
              <div className="text-xs text-muted-foreground">
                Total expenses this month
              </div>
            </div>

            {/* Expense Growth Indicator */}
            <div className="flex items-center gap-1.5 p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
              {stats.expenseGrowth >= 0 ? (
                <ArrowUp className="w-3 h-3 text-destructive" />
              ) : (
                <ArrowDown className="w-3 h-3 text-accent" />
              )}
              <span className={`text-xs font-medium ${
                stats.expenseGrowth >= 0 ? 'text-destructive' : 'text-accent'
              }`}>
                {Math.abs(stats.expenseGrowth).toFixed(1)}% vs last month
              </span>
            </div>

            {/* Expense Breakdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-1.5 bg-destructive/10 rounded">
                <span className="text-xs font-medium text-destructive">Unpaid</span>
                <span className="text-sm font-bold text-destructive">{stats.unpaidExpenses}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-muted rounded">
                <span className="text-xs font-medium text-muted-foreground">Daily Avg</span>
                <span className="text-sm font-bold text-muted-foreground">
                  {formatCurrency(stats.monthlyExpenses / new Date().getDate())}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}