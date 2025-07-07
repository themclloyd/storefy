import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Target,
  Activity,
  Zap,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Eye,
  Calendar
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
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
}

interface SalesChartData {
  time: string;
  sales: number;
  orders: number;
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
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesChartData, setSalesChartData] = useState<SalesChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (currentStore && user) {
      fetchDashboardData();
      // Set up real-time updates every 5 minutes
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [currentStore, user]);

  const fetchDashboardData = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);
      await Promise.all([
        fetchSalesMetrics(),
        fetchInventoryMetrics(),
        fetchCustomerMetrics(),
        fetchOperationalMetrics(),
        fetchRecentOrders(),
        fetchTopProducts(),
        fetchSalesChartData(),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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

  const fetchRecentOrders = async () => {
    if (!currentStore) return;

    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        created_at,
        customers (name)
      `)
      .eq('store_id', currentStore.id)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentOrders(orders || []);
  };

  const fetchTopProducts = async () => {
    if (!currentStore) return;

    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        products (id, name, image_url),
        orders!inner (store_id, status, created_at)
      `)
      .eq('orders.store_id', currentStore.id)
      .eq('orders.status', 'completed')
      .gte('orders.created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!orderItems) return;

    const productSales = orderItems.reduce((acc: any, item: any) => {
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
      acc[productId].sales += Number(item.price) * item.quantity;
      acc[productId].quantity += item.quantity;
      return acc;
    }, {});

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.sales - a.sales)
      .slice(0, 5) as TopProduct[];

    setTopProducts(topProducts);

    if (topProducts.length > 0) {
      setStats(prev => ({ ...prev, topSellingProduct: topProducts[0].name }));
    }
  };

  const fetchSalesChartData = async () => {
    if (!currentStore) return;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const chartData = await Promise.all(
      last7Days.map(async (date) => {
        const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
        const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();

        const { data: orders } = await supabase
          .from('orders')
          .select('total')
          .eq('store_id', currentStore.id)
          .eq('status', 'completed')
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);

        const sales = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
        const orderCount = orders?.length || 0;

        return {
          time: date.toLocaleDateString('en-US', { weekday: 'short' }),
          sales,
          orders: orderCount,
        };
      })
    );

    setSalesChartData(chartData);
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
    <div className="space-y-8">
      {/* Header with Live Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Exceptional Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time insights and performance indicators for {currentStore?.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            Live Data
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <span className="text-sm text-muted-foreground">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Core Sales Metrics - Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales - Primary KPI */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Sales
            </CardTitle>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-green-700 dark:text-green-400 animate-pulse">
                ${stats.todaysSales.toFixed(2)}
              </div>
              <div className="flex items-center gap-2">
                {stats.salesGrowth >= 0 ? (
                  <ArrowUp className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  stats.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(stats.salesGrowth).toFixed(1)}% vs yesterday
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target Progress</span>
                  <span className="font-medium">{stats.salesTargetProgress.toFixed(0)}%</span>
                </div>
                <Progress
                  value={Math.min(stats.salesTargetProgress, 100)}
                  className="h-2 bg-green-100 dark:bg-green-900/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Transaction Value */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Transaction Value
            </CardTitle>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                ${stats.averageTransactionValue.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                From {stats.totalOrders} orders today
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">
                  Optimizing customer value
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Status
            </CardTitle>
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                {stats.totalProducts}
              </div>
              <div className="text-sm text-muted-foreground">Total Products</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600">Low Stock</span>
                  <Badge variant={stats.lowStockItems > 0 ? "destructive" : "outline"}>
                    {stats.lowStockItems}
                  </Badge>
                </div>
                {stats.outOfStockItems > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Out of Stock</span>
                    <Badge variant="destructive" className="animate-pulse">
                      {stats.outOfStockItems}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customer Insights
            </CardTitle>
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                {stats.totalCustomers}
              </div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">New Today</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    +{stats.newCustomersToday}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600">VIP Members</span>
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    {stats.vipCustomers}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Growth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Sales Trend (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="time"
                    className="text-sm"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    className="text-sm"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === 'sales' ? `$${value.toFixed(2)}` : value,
                      name === 'sales' ? 'Sales' : 'Orders'
                    ]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${product.sales.toFixed(2)}</p>
                      <div className="w-16 h-2 bg-green-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min((product.sales / (topProducts[0]?.sales || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Intelligence & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              Recent Orders
              <Badge variant="outline" className="ml-auto">
                {recentOrders.length} orders
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg hover:bg-muted/40 transition-all duration-200 hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customers?.name || 'Walk-in Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${Number(order.total).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No recent orders</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Open POS System
            </Button>

            {stats.lowStockItems > 0 && (
              <Button variant="outline" className="w-full justify-start border-orange-200 hover:bg-orange-50">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                Restock Items ({stats.lowStockItems})
              </Button>
            )}

            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              View Customers
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Reports
            </Button>

            {/* Business Alerts */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Business Alerts
              </h4>

              {stats.salesTargetProgress >= 100 && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">Sales target achieved!</span>
                </div>
              )}

              {stats.outOfStockItems > 0 && (
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                  <span className="text-sm text-red-700 dark:text-red-400">
                    {stats.outOfStockItems} items out of stock
                  </span>
                </div>
              )}

              {stats.newCustomersToday > 0 && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 dark:text-blue-400">
                    {stats.newCustomersToday} new customers today
                  </span>
                </div>
              )}

              {stats.salesTargetProgress < 50 && new Date().getHours() > 14 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-400">
                    Behind sales target
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="border-0 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                {stats.customerRetentionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Customer Retention</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                ${stats.inventoryValue.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Inventory Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                {stats.profitMargin.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Profit Margin</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                ${stats.averageCustomerValue.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Customer Value</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}