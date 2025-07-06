import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  todaysSales: number;
  totalOrders: number;
  lowStockItems: number;
  totalCustomers: number;
}

export function DashboardView() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todaysSales: 0,
    totalOrders: 0,
    lowStockItems: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentStore && user) {
      fetchDashboardData();
    }
  }, [currentStore, user]);

  const fetchDashboardData = async () => {
    if (!currentStore) return;

    try {
      // Get today's date range
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Fetch today's sales
      const { data: todaysOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', currentStore.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      const todaysSales = todaysOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      // Fetch total orders count for today
      const totalOrders = todaysOrders?.length || 0;

      // Fetch low stock items
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, stock_quantity, low_stock_threshold')
        .eq('store_id', currentStore.id)
        .eq('is_active', true);

      const lowStockItems = lowStockProducts?.filter(
        product => product.stock_quantity <= product.low_stock_threshold
      ).length || 0;

      // Fetch total customers
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', currentStore.id);

      // Fetch recent orders
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
        .limit(4);

      setStats({
        todaysSales,
        totalOrders,
        lowStockItems,
        totalCustomers: customersCount || 0,
      });

      setRecentOrders(orders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: "Today's Sales",
      value: `$${stats.todaysSales.toFixed(2)}`,
      change: "+12.5%",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "Orders",
      value: stats.totalOrders.toString(),
      change: "+8.2%",
      trend: "up" as const,
      icon: ShoppingCart,
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems.toString(),
      change: stats.lowStockItems > 0 ? "Alert" : "Good",
      trend: stats.lowStockItems > 0 ? "down" : "up" as const,
      icon: Package,
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      change: "+3",
      trend: "up" as const,
      icon: Users,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Loading store data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="card-professional">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening at {currentStore?.name} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
          
          return (
            <Card key={stat.title} className="card-professional">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === "up" ? "text-success" : "text-destructive"
                  }`}>
                    <TrendIcon className="h-3 w-3" />
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customers?.name || 'Walk-in Customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">${Number(order.total).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent orders</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full p-4 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-smooth">
              Open POS System
            </button>
            <button className="w-full p-4 bg-secondary/10 text-secondary rounded-lg font-medium hover:bg-secondary/20 transition-smooth">
              Add New Product
            </button>
            <button className="w-full p-4 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-smooth">
              View Reports
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}