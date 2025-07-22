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
  BarChart3,
  PieChart
} from 'lucide-react';
import { useCurrentStore } from '@/stores/storeStore';
import { useStoreData } from '@/hooks/useSupabaseClient';
import { useTax } from '@/hooks/useTax';
import { PageHeader, PageLayout } from '@/components/common/PageHeader';
import { InlineLoading } from '@/components/ui/modern-loading';
import { ResponsiveCardGrid } from '@/components/ui/responsive-table';
import { useScreenSize } from '@/hooks/use-mobile';
import { responsiveGrid, responsiveSpacing, responsiveText, touchFriendly } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
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
  const currentStore = useCurrentStore();
  const { from, currentStoreId, isPinSession } = useStoreData();
  const { formatCurrency } = useTax();
  const { isMobile, isTablet } = useScreenSize();
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
    <div className="h-full p-6 bg-background">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Hi, here's what's happening in your store
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">Today</Button>
            <Button variant="outline" size="sm" className="text-xs">This Week</Button>
            <Button variant="outline" size="sm" className="text-xs">This Month</Button>
            <Button
              onClick={() => onViewChange('reports')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              All Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="h-[calc(100%-120px)] grid grid-cols-12 gap-6">
        {/* Left Column - Main Metrics */}
        <div className="col-span-8 space-y-6">
          {/* Hero Metrics */}
          <div className="grid grid-cols-3 gap-6">
            {/* Primary Revenue Metric */}
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">This month your store has sold</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">
                  That's {formatCurrency(stats.todayRevenue)} more than this time last month!
                </p>
              </div>
            </Card>

            {/* All Orders Chart */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">All Orders</p>
                  <div className="h-16 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.weeklyRevenue.slice(0, 7)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </Card>

            {/* Average Sale Value */}
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Average Sale Value</p>
                <p className="text-3xl font-bold">
                  {stats.totalOrders > 0 ? formatCurrency(stats.totalRevenue / stats.totalOrders) : formatCurrency(0)}
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Items per Sale</p>
                  <p className="text-xl font-semibold">{stats.totalOrders > 0 ? Math.round(stats.totalProducts / Math.max(stats.totalOrders, 1)) : 0}</p>
                  <p className="text-xs text-muted-foreground">0.95 items than last month</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Chart Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Sales this Month</h3>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  SHOW MORE RETAIL METRICS
                </Button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.weeklyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="text-sm font-medium">{label}</p>
                              <p className="text-sm text-primary">
                                Revenue: {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Bottom Metrics Row */}
          <div className="grid grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Your Sales Targets</p>
                <p className="text-3xl font-bold">{formatCurrency(800.80)}</p>
                <Button variant="link" className="p-0 h-auto text-xs text-primary">
                  Set a sales target
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Average Sales Targets</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue / Math.max(stats.totalOrders, 1))}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(20.95)} less than last month
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Average Items per Sale</p>
                <p className="text-3xl font-bold">{Math.round(stats.totalProducts / Math.max(stats.totalOrders, 1))}</p>
                <p className="text-xs text-muted-foreground">
                  0.08 more than last month
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Transfer Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Transfer</h3>
              <p className="text-sm text-muted-foreground">
                You have 1 transfer waiting to be received
              </p>
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Beats Studio Pro</p>
                  <p className="text-xs text-muted-foreground">20 pcs</p>
                  <p className="text-xs text-muted-foreground">Texas warehouse → IT Dept.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs">
                VIEW TRANSFER
              </Button>
            </div>
          </Card>

          {/* Purchase Orders Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Purchase Orders</h3>
              <p className="text-sm text-muted-foreground">
                You have 6 dispatched orders waiting to be received
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="aspect-square bg-muted/50 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs">
                VIEW DISPATCHED ORDERS
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>

  );
}
