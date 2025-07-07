import React, { useEffect, useState } from "react";
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
import { BusinessMetrics, BusinessAlert } from "./types";
import {
  fetchSalesIntelligence,
  fetchInventoryIntelligence,
  fetchCustomerIntelligence,
  fetchOperationalIntelligence,
  fetchRecentOrders,
  generateBusinessAlerts
} from "./fetchers";
import {
  SalesVelocityWidget,
  InventoryTurnoverWidget,
  ProfitMarginWidget,
  CustomerAcquisitionWidget
} from "../BusinessMetricsWidget";
import { RealTimeMonitor } from "../RealTimeMonitor";
import { BusinessAlertsSystem } from "../BusinessAlertsSystem";
import { InteractiveBusinessWidgets } from "../InteractiveBusinessWidgets";
import { BusinessIntelligenceAnalytics } from "../BusinessIntelligenceAnalytics";

export function BusinessIntelligenceDashboard() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    todaysSales: 0,
    yesterdaysSales: 0,
    salesVelocity: 0,
    averageOrderValue: 0,
    salesTarget: 500,
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
      const interval = setInterval(fetchBusinessIntelligence, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line
  }, [currentStore, user]);

  const fetchBusinessIntelligence = async () => {
    if (!currentStore) return;
    try {
      setLoading(true);
      await Promise.all([
        fetchSalesIntelligence(currentStore, metrics, setMetrics),
        fetchInventoryIntelligence(currentStore, metrics, setMetrics),
        fetchCustomerIntelligence(currentStore, setMetrics),
        fetchOperationalIntelligence(currentStore, setMetrics),
        fetchRecentOrders(currentStore, setRecentOrders),
        generateBusinessAlerts(metrics, setAlerts),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading business intelligence...</span>
      </div>
    );
  }

  // ...rest of the render logic (KPI cards, widgets, etc.)
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
      {/* ...rest of the dashboard UI ... */}
    </div>
  );
} 