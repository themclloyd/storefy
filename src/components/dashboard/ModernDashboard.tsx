import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  ShoppingCart,
  Activity,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Calendar,
  Target,
  BarChart3
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ModernDashboardMetrics {
  todaysSales: number;
  yesterdaysSales: number;
  salesGrowth: number;
  totalReturn: number;
  returnGrowth: number;
  totalOrders: number;
  totalProducts: number;
  lowStockItems: number;
  totalCustomers: number;
  newCustomersToday: number;
  totalViewPerformance: number;
}

interface RecentTransaction {
  id: string;
  product_name: string;
  status: 'completed' | 'pending';
  amount: number;
  date: string;
  order_number: string;
}

export function ModernDashboard() {
  const { currentStore } = useStore();
  const { user } = useAuth();

  // Simple currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const [metrics, setMetrics] = useState<ModernDashboardMetrics>({
    todaysSales: 193000,
    yesterdaysSales: 147000,
    salesGrowth: 31.3,
    totalReturn: 32000,
    returnGrowth: -24,
    totalOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
    totalCustomers: 0,
    newCustomersToday: 0,
    totalViewPerformance: 565000,
  });

  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([
    {
      id: '1',
      product_name: 'Premium T-Shirt',
      status: 'completed',
      amount: 29.99,
      date: 'Jul 12th 2024',
      order_number: 'OJWEJS75INC'
    },
    {
      id: '2', 
      product_name: 'PlayStation 5',
      status: 'pending',
      amount: 499.99,
      date: 'Jul 12th 2024',
      order_number: 'OJWEJS75INC'
    },
    {
      id: '3',
      product_name: 'Hoodie Gembong',
      status: 'pending', 
      amount: 45.00,
      date: 'Jul 12th 2024',
      order_number: 'OJWEJS75INC'
    }
  ]);

  useEffect(() => {
    if (currentStore) {
      fetchDashboardData();
    }
  }, [currentStore]);

  const fetchDashboardData = async () => {
    if (!currentStore) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchSalesMetrics(),
        fetchInventoryMetrics(),
        fetchCustomerMetrics(),
        fetchRecentTransactions()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesMetrics = async () => {
    // Implementation would fetch real data from Supabase
    // For now using demo data
  };

  const fetchInventoryMetrics = async () => {
    if (!currentStore) return;

    const { data: products } = await supabase
      .from('products')
      .select('id, stock_quantity, low_stock_threshold')
      .eq('store_id', currentStore.id)
      .eq('is_active', true);

    if (products) {
      setMetrics(prev => ({
        ...prev,
        totalProducts: products.length,
        lowStockItems: products.filter(p => p.stock_quantity <= p.low_stock_threshold).length,
      }));
    }
  };

  const fetchCustomerMetrics = async () => {
    if (!currentStore) return;

    const { data: customers } = await supabase
      .from('customers')
      .select('id, created_at')
      .eq('store_id', currentStore.id);

    if (customers) {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      
      setMetrics(prev => ({
        ...prev,
        totalCustomers: customers.length,
        newCustomersToday: customers.filter(c => 
          new Date(c.created_at) >= todayStart
        ).length,
      }));
    }
  };

  const fetchRecentTransactions = async () => {
    // Implementation would fetch real transaction data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            An any way to manage sales with care and precision.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            January 2024 - May 2024
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          <Button className="flex items-center gap-2">
            <span>Add new product</span>
          </Button>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sales Revenue Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-qb-green-50 to-qb-green-100 dark:from-qb-green-950/20 dark:to-qb-green-900/20 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <Badge variant="secondary" className="mb-2">
                Update
              </Badge>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Income
              </CardTitle>
            </div>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(metrics.todaysSales)}
              </div>
              <div className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  +{metrics.salesGrowth.toFixed(1)}% from last month
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Return Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Return
            </CardTitle>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(metrics.totalReturn)}
              </div>
              <div className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">
                  {Math.abs(metrics.returnGrowth)}% from last month
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total View Performance */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total View Performance
            </CardTitle>
            <div className="w-12 h-12 bg-qb-green-100 rounded-full flex items-center justify-center">
              <div className="text-2xl font-bold text-qb-green-600">565K</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Here are some tips on how to improve your score.
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Guide Views
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Promotional Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-qb-green-100 to-qb-green-200 dark:from-qb-green-900/20 dark:to-qb-green-800/20 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-lg font-bold text-qb-green-800 dark:text-qb-green-200">
                Level up your sales managing to the next level.
              </div>
              <div className="text-sm text-qb-green-700 dark:text-qb-green-300">
                An any way to manage sales with care and precision.
              </div>
              <Button className="w-full bg-green-700 hover:bg-green-800 text-white">
                Update to Siohioma+
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Transactions and Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction List */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Transaction</CardTitle>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-qb-green-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-qb-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.product_name}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    <p className="text-xs text-muted-foreground">{transaction.order_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                    className={cn(
                      "text-xs",
                      transaction.status === 'completed'
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-orange-100 text-orange-800 border-orange-200"
                    )}
                  >
                    {transaction.status === 'completed' ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Revenue</CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-qb-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Expenses</span>
                </div>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">{formatCurrency(metrics.todaysSales)}</div>
              <div className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+{metrics.salesGrowth.toFixed(0)}% from last month</span>
              </div>

              {/* Simple Bar Chart Representation */}
              <div className="space-y-3 mt-6">
                <div className="flex items-end gap-2 h-32">
                  {[40, 60, 35, 80, 45, 70, 55, 90, 65, 75, 50, 85].map((height, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary rounded-t-sm"
                        style={{ height: `${height}%` }}
                      ></div>
                      <div
                        className="w-full bg-green-400 rounded-b-sm"
                        style={{ height: `${Math.max(20, 100 - height)}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>100</span>
                  <span>200</span>
                  <span>300</span>
                  <span>400</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Report Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Sales Report</CardTitle>
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Product Launched (233)</div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Ongoing Product (23)</div>
              <Progress value={45} className="h-2 bg-green-100" />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Product Sold (462)</div>
              <Progress value={90} className="h-2 bg-orange-100" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
