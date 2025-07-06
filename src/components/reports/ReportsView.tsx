import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Calendar, Download, DollarSign, ShoppingCart, Users, Package, Loader2 } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SalesData {
  period: string;
  sales: number;
  orders: number;
  customers: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface DiscountData {
  code: string;
  usage: number;
  discount: number;
  type: string;
}

export function ReportsView() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentDiscounts, setRecentDiscounts] = useState<DiscountData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentStore && user) {
      fetchReportsData();
    }
  }, [currentStore, user]);

  const fetchReportsData = async () => {
    if (!currentStore) return;

    try {
      await Promise.all([
        fetchSalesData(),
        fetchTopProducts(),
        fetchDiscountData(),
      ]);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    if (!currentStore) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Fetch today's data
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('total, customer_id')
      .eq('store_id', currentStore.id)
      .gte('created_at', today.toISOString());

    // Fetch yesterday's data
    const { data: yesterdayOrders } = await supabase
      .from('orders')
      .select('total, customer_id')
      .eq('store_id', currentStore.id)
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    // Fetch this week's data
    const { data: weekOrders } = await supabase
      .from('orders')
      .select('total, customer_id')
      .eq('store_id', currentStore.id)
      .gte('created_at', weekStart.toISOString());

    // Fetch this month's data
    const { data: monthOrders } = await supabase
      .from('orders')
      .select('total, customer_id')
      .eq('store_id', currentStore.id)
      .gte('created_at', monthStart.toISOString());

    const calculateStats = (orders: any[]) => ({
      sales: orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0,
      orders: orders?.length || 0,
      customers: new Set(orders?.map(order => order.customer_id).filter(Boolean)).size || 0,
    });

    const todayStats = calculateStats(todayOrders || []);
    const yesterdayStats = calculateStats(yesterdayOrders || []);
    const weekStats = calculateStats(weekOrders || []);
    const monthStats = calculateStats(monthOrders || []);

    setSalesData([
      { period: "Today", ...todayStats },
      { period: "Yesterday", ...yesterdayStats },
      { period: "This Week", ...weekStats },
      { period: "This Month", ...monthStats },
    ]);
  };

  const fetchTopProducts = async () => {
    if (!currentStore) return;

    const { data: productSales } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        products (name)
      `)
      .eq('products.store_id', currentStore.id);

    if (!productSales) {
      setTopProducts([]);
      return;
    }

    // Group by product and calculate totals
    const productMap = new Map();
    productSales.forEach(item => {
      const productName = item.products?.name;
      if (productName) {
        const existing = productMap.get(productName) || { sales: 0, revenue: 0 };
        productMap.set(productName, {
          sales: existing.sales + item.quantity,
          revenue: existing.revenue + Number(item.total_price),
        });
      }
    });

    // Convert to array and sort by revenue
    const topProductsArray = Array.from(productMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);

    setTopProducts(topProductsArray);
  };

  const fetchDiscountData = async () => {
    if (!currentStore) return;

    const { data: discountOrders } = await supabase
      .from('orders')
      .select('discount_code, discount_amount')
      .eq('store_id', currentStore.id)
      .not('discount_code', 'is', null);

    if (!discountOrders) {
      setRecentDiscounts([]);
      return;
    }

    // Group by discount code
    const discountMap = new Map();
    discountOrders.forEach(order => {
      const code = order.discount_code;
      if (code) {
        const existing = discountMap.get(code) || { usage: 0, discount: 0 };
        discountMap.set(code, {
          usage: existing.usage + 1,
          discount: existing.discount + Number(order.discount_amount || 0),
          type: 'Unknown', // We don't store discount type in the current schema
        });
      }
    });

    // Convert to array and sort by usage
    const discountArray = Array.from(discountMap.entries())
      .map(([code, stats]) => ({ code, ...stats }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 3);

    setRecentDiscounts(discountArray);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your business performance and insights
          </p>
        </div>
        <Button className="bg-gradient-primary text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesData.map((data, index) => (
          <Card key={data.period} className="card-professional">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {data.period}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">Sales</span>
                </div>
                <span className="font-bold text-success">${data.sales.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Orders</span>
                </div>
                <span className="font-medium text-foreground">{data.orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-muted-foreground">Customers</span>
                </div>
                <span className="font-medium text-foreground">{data.customers}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="w-5 h-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No product sales data available</p>
                  <p className="text-sm">Start making sales to see top products</p>
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">${product.revenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Discount Usage */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="w-5 h-5" />
              Discount Code Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDiscounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No discount codes used yet</p>
                  <p className="text-sm">Discount usage will appear here</p>
                </div>
              ) : (
                recentDiscounts.map((discount) => (
                  <div key={discount.code} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono">
                          {discount.code}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {discount.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Used {discount.usage} times</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-warning">${discount.discount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Total discount</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="w-5 h-5" />
            Sales Trend (7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Sales chart will be displayed here</p>
              <p className="text-sm text-muted-foreground">Chart integration coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}