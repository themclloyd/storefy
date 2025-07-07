// This file has been refactored.
// All logic is now in ./BusinessIntelligenceDashboard/
// Please import from '@/components/dashboard/BusinessIntelligenceDashboard'

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Users,
  Package,
  ShoppingCart,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Calendar,
  Eye,
  RefreshCw
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  SalesVelocityWidget,
  InventoryTurnoverWidget,
  ProfitMarginWidget,
  CustomerAcquisitionWidget
} from "./BusinessMetricsWidget";
import { RealTimeMonitor } from "./RealTimeMonitor";
import { BusinessAlertsSystem } from "./BusinessAlertsSystem";
import { InteractiveBusinessWidgets } from "./InteractiveBusinessWidgets";
import { BusinessIntelligenceAnalytics } from "./BusinessIntelligenceAnalytics";

interface BusinessMetrics {
  // Sales Intelligence
  todaysSales: number;
  yesterdaysSales: number;
  salesVelocity: number;
  averageOrderValue: number;
  salesTarget: number;
  salesTargetProgress: number;
  
  // Inventory Intelligence
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  inventoryTurnover: number;
  topSellingProduct: string;
  slowMovingItems: number;
  
  // Customer Intelligence
  totalCustomers: number;
  newCustomersToday: number;
  vipCustomers: number;
  customerRetentionRate: number;
  averageCustomerValue: number;
  
  // Operational Intelligence
  ordersToday: number;
  ordersFulfilled: number;
  pendingOrders: number;
  refundRate: number;
  profitMargin: number;
  
  // Financial Intelligence
  grossRevenue: number;
  netProfit: number;
  cashFlow: number;
  outstandingPayments: number;
}

interface BusinessAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
  timestamp: Date;
}

export function BusinessIntelligenceDashboard() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    todaysSales: 0,
    yesterdaysSales: 0,
    salesVelocity: 0,
    averageOrderValue: 0,
    salesTarget: 500, // More realistic daily target
    salesTargetProgress: 0,
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    inventoryTurnover: 0,
    topSellingProduct: '',
    slowMovingItems: 0,
    totalCustomers: 0,
    newCustomersToday: 0,
    vipCustomers: 0,
    customerRetentionRate: 0,
    averageCustomerValue: 0,
    ordersToday: 0,
    ordersFulfilled: 0,
    pendingOrders: 0,
    refundRate: 0,
    profitMargin: 0,
    grossRevenue: 0,
    netProfit: 0,
    cashFlow: 0,
    outstandingPayments: 0,
  });
  
  const [alerts, setAlerts] = useState<BusinessAlert[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (currentStore && user) {
      fetchBusinessIntelligence();
      // Set up real-time updates every 5 minutes
      const interval = setInterval(fetchBusinessIntelligence, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [currentStore, user]);

  const fetchBusinessIntelligence = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);
      await Promise.all([
        fetchSalesIntelligence(),
        fetchInventoryIntelligence(),
        fetchCustomerIntelligence(),
        fetchOperationalIntelligence(),
        fetchRecentOrders(),
        generateBusinessAlerts(),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching business intelligence:', error);
      toast.error('Failed to load business intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesIntelligence = async () => {
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
    const averageOrderValue = todaysOrders?.length ? todaysSales / todaysOrders.length : 0;
    const salesVelocity = yesterdaysSales > 0 ? ((todaysSales - yesterdaysSales) / yesterdaysSales) * 100 : 0;
    const salesTargetProgress = (todaysSales / metrics.salesTarget) * 100;

    setMetrics(prev => ({
      ...prev,
      todaysSales,
      yesterdaysSales,
      salesVelocity,
      averageOrderValue,
      salesTargetProgress,
      ordersToday: todaysOrders?.length || 0,
    }));
  };

  const fetchInventoryIntelligence = async () => {
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
    const slowMovingItems = products.filter(p => p.stock_quantity > p.low_stock_threshold * 3).length;

    // Calculate inventory turnover (simplified)
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.cost || 0)), 0);
    const inventoryTurnover = totalInventoryValue > 0 ? (metrics.todaysSales * 365) / totalInventoryValue : 0;

    setMetrics(prev => ({
      ...prev,
      totalProducts,
      lowStockItems,
      outOfStockItems,
      slowMovingItems,
      inventoryTurnover,
    }));
  };

  const fetchCustomerIntelligence = async () => {
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
    const averageCustomerValue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / totalCustomers;
    
    // Simple retention rate calculation
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const customerRetentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

    setMetrics(prev => ({
      ...prev,
      totalCustomers,
      newCustomersToday,
      vipCustomers,
      averageCustomerValue,
      customerRetentionRate,
    }));
  };

  const fetchOperationalIntelligence = async () => {
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

    // Calculate profit margin
    const grossRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalDiscounts = orders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);
    const netProfit = grossRevenue - totalDiscounts; // Simplified
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    setMetrics(prev => ({
      ...prev,
      ordersFulfilled,
      pendingOrders,
      refundRate,
      grossRevenue,
      netProfit,
      profitMargin,
      cashFlow: netProfit, // Simplified
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

  const generateBusinessAlerts = async () => {
    const newAlerts: BusinessAlert[] = [];

    // Low stock alerts
    if (metrics.lowStockItems > 0) {
      newAlerts.push({
        id: 'low-stock',
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${metrics.lowStockItems} products are running low on stock`,
        action: 'View Inventory',
        timestamp: new Date(),
      });
    }

    // Out of stock alerts
    if (metrics.outOfStockItems > 0) {
      newAlerts.push({
        id: 'out-of-stock',
        type: 'critical',
        title: 'Out of Stock',
        message: `${metrics.outOfStockItems} products are out of stock`,
        action: 'Restock Now',
        timestamp: new Date(),
      });
    }

    // Sales target alerts
    if (metrics.salesTargetProgress >= 100) {
      newAlerts.push({
        id: 'sales-target',
        type: 'success',
        title: 'Sales Target Achieved!',
        message: 'Congratulations! You\'ve reached today\'s sales target',
        timestamp: new Date(),
      });
    } else if (metrics.salesTargetProgress < 30 && new Date().getHours() > 16) {
      newAlerts.push({
        id: 'sales-behind',
        type: 'warning',
        title: 'Sales Behind Target',
        message: `Only ${metrics.salesTargetProgress.toFixed(0)}% of daily target achieved`,
        action: 'View POS',
        timestamp: new Date(),
      });
    }

    // New customer opportunity
    if (metrics.newCustomersToday > 0) {
      newAlerts.push({
        id: 'new-customers',
        type: 'info',
        title: 'New Customers Today',
        message: `${metrics.newCustomersToday} new customers acquired today`,
        action: 'View Customers',
        timestamp: new Date(),
      });
    }

    setAlerts(newAlerts);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading business intelligence...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Data
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBusinessIntelligence}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sales Performance */}
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Sales
            </CardTitle>
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                ${metrics.todaysSales.toFixed(2)}
              </div>
              <div className="flex items-center gap-2">
                {metrics.salesVelocity >= 0 ? (
                  <ArrowUp className="w-4 h-4 text-success" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-destructive" />
                )}
                <span className={`text-sm ${
                  metrics.salesVelocity >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {Math.abs(metrics.salesVelocity).toFixed(1)}% vs yesterday
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target Progress</span>
                  <span className="text-foreground">{metrics.salesTargetProgress.toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(metrics.salesTargetProgress, 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Status
            </CardTitle>
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {metrics.totalProducts}
              </div>
              <div className="text-sm text-muted-foreground">Total Products</div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600">Low Stock</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    {metrics.lowStockItems}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-destructive">Out of Stock</span>
                  <Badge variant="destructive">
                    {metrics.outOfStockItems}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customer Insights
            </CardTitle>
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {metrics.totalCustomers}
              </div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-success">New Today</span>
                  <Badge variant="outline" className="text-success border-success">
                    +{metrics.newCustomersToday}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600">VIP</span>
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    {metrics.vipCustomers}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Efficiency */}
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operations
            </CardTitle>
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {metrics.ordersToday}
              </div>
              <div className="text-sm text-muted-foreground">Orders Today</div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-success">Fulfilled</span>
                  <Badge variant="outline" className="text-success border-success">
                    {metrics.ordersFulfilled}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600">Pending</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    {metrics.pendingOrders}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ShoppingCart className="w-5 h-5 text-green-500" />
              Recent Orders
            </CardTitle>
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
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent orders</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-gradient-primary text-white">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Open POS System
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Package className="w-4 h-4 mr-2" />
              Restock Low Items ({metrics.lowStockItems})
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              View Customers
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Business Alerts - Only show if there are alerts */}
      {alerts.length > 0 && (
        <Card className="card-professional border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bell className="w-5 h-5 text-orange-500" />
              Business Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  {alert.type === 'critical' && <XCircle className="w-5 h-5 text-destructive" />}
                  {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                  {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
                  {alert.type === 'info' && <Eye className="w-5 h-5 text-blue-500" />}
                  <div>
                    <p className="font-medium text-foreground">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
                {alert.action && (
                  <Button variant="outline" size="sm">
                    {alert.action}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
