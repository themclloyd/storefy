import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessIntelligenceDashboard } from "./BusinessIntelligenceDashboard";

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
        <h1 className="text-3xl font-bold text-foreground">Business Intelligence Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real-time insights and actionable intelligence for {currentStore?.name}
        </p>
      </div>

      {/* Business Intelligence Dashboard */}
      <BusinessIntelligenceDashboard />
    </div>
  );
}