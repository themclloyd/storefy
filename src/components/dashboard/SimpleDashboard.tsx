import React, { useState, useEffect } from 'react';
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
  ArrowUpRight,
  Eye,
  Loader2,
  BarChart3,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/contexts/StoreContext';
import { useStoreData } from '@/hooks/useSupabaseClient';
import { useTax } from '@/hooks/useTax';
import { InlineLoading } from '@/components/ui/modern-loading';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

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

export function SimpleDashboard({ onViewChange }: DashboardProps) {
  const { currentStore } = useStore();
  const { from, currentStoreId, isPinSession } = useStoreData();
  const { formatCurrency } = useTax();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockItems: 0,
    todayRevenue: 0,
    todayOrders: 0,
    recentTransactions: [],
    salesByCategory: [],
    weeklyRevenue: []
  });

  useEffect(() => {
    if ((currentStore && !isPinSession) || (currentStoreId && isPinSession)) {
      fetchDashboardData();
    }
  }, [currentStore, currentStoreId, isPinSession]);

  const fetchDashboardData = async () => {
    const storeId = currentStoreId || currentStore?.id;
    if (!storeId) return;

    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];

      // Fetch basic counts
      const [
        { count: totalCustomers },
        { count: totalProducts },
        { count: totalOrders },
        { count: lowStockItems }
      ] = await Promise.all([
        from('customers').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
        from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('is_active', true),
        from('transactions').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
        from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).lt('stock_quantity', 10)
      ]);

      // Fetch revenue data
      const { data: transactions } = await from('transactions')
        .select('amount, created_at, customer_name')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(100);

      const totalRevenue = transactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
      const todayTransactions = transactions?.filter(t => t.created_at.startsWith(today)) || [];
      const todayRevenue = todayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const todayOrders = todayTransactions.length;

      // Format recent transactions
      const recentTransactions = (transactions?.slice(0, 5) || []).map((t, index) => ({
        id: `txn-${index}`,
        amount: Number(t.amount) || 0,
        customer: t.customer_name || 'Walk-in Customer',
        time: new Date(t.created_at).toLocaleTimeString(),
        items: 1 // Simplified
      }));

      // Fetch category sales data for pie chart
      const { data: categoryData } = await from('products')
        .select(`
          categories (name),
          stock_quantity
        `)
        .eq('store_id', storeId)
        .eq('is_active', true);

      // Process category data for pie chart
      const categoryStats = categoryData?.reduce((acc, product) => {
        const categoryName = product.categories?.name || 'Uncategorized';
        const stock = product.stock_quantity || 0;
        acc[categoryName] = (acc[categoryName] || 0) + stock;
        return acc;
      }, {} as Record<string, number>) || {};

      const colors = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent-foreground))', 'hsl(var(--secondary-foreground))', 'hsl(var(--destructive))', 'hsl(var(--border))'];
      const salesByCategory = Object.entries(categoryStats)
        .slice(0, 6)
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }));

      // Generate weekly revenue data for bar chart
      const weeklyRevenue = [];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayTransactions = transactions?.filter(t =>
          new Date(t.created_at).toDateString() === date.toDateString()
        ) || [];

        weeklyRevenue.push({
          day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
          revenue: dayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
          orders: dayTransactions.length
        });
      }

      setStats({
        totalRevenue,
        totalOrders: totalOrders || 0,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        lowStockItems: lowStockItems || 0,
        todayRevenue,
        todayOrders,
        recentTransactions,
        salesByCategory,
        weeklyRevenue
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <InlineLoading text="Loading dashboard..." size="lg" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back! Here's what's happening at your store today.
          </p>
        </div>
        <Button
          onClick={() => onViewChange('reports')}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto"
          size="sm"
        >
          <BarChart3 className="w-4 h-4" />
          Full Report
        </Button>
      </div>

      {/* Stats Cards - Mobile 2x2 Grid, Desktop 3 columns */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              </div>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.todayRevenue)} today
            </p>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Orders</CardTitle>
              </div>
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.todayOrders} today
            </p>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Customers</CardTitle>
              </div>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total registered
            </p>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Products</CardTitle>
              </div>
              {stats.lowStockItems > 0 ? (
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive hidden sm:block" />
              ) : (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
              )}
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.lowStockItems > 0 ? (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-2 w-2 sm:h-3 sm:w-3" />
                  {stats.lowStockItems} low stock
                </span>
              ) : (
                "All in stock"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts and Analytics */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales by Category - Pie Chart Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <PieChart className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Inventory by Category</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={stats.salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} items`, 'Stock']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {stats.salesByCategory.slice(0, 3).map((category, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Revenue - Bar Chart Card */}
        <Card className="relative overflow-hidden md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Revenue Trend</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground">
              <span>Last 7 days performance</span>
              <div className="flex items-center gap-4">
                <span>{stats.weeklyRevenue.reduce((sum, day) => sum + day.orders, 0)} total orders</span>
                <span className="text-primary font-medium">
                  {formatCurrency(stats.weeklyRevenue.reduce((sum, day) => sum + day.revenue, 0))} total
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Responsive Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Button
          onClick={() => onViewChange('pos')}
          className="h-14 sm:h-16 flex items-center justify-center gap-2 sm:gap-3 bg-primary hover:bg-primary/90 text-sm sm:text-base"
        >
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-medium">New Sale</span>
        </Button>

        <Button
          onClick={() => onViewChange('inventory')}
          variant="outline"
          className="h-14 sm:h-16 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
        >
          <Package className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-medium">Inventory</span>
        </Button>

        <Button
          onClick={() => onViewChange('customers')}
          variant="outline"
          className="h-14 sm:h-16 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
        >
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-medium">Customers</span>
        </Button>

        <Button
          onClick={() => onViewChange('transactions')}
          variant="outline"
          className="h-14 sm:h-16 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
        >
          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-medium">Transactions</span>
        </Button>
      </div>



      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No transactions yet today
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{transaction.customer}</p>
                    <p className="text-sm text-muted-foreground">{transaction.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                    <p className="text-sm text-muted-foreground">{transaction.items} item(s)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
