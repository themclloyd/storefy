import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Zap, 
  Clock, 
  Users, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";

interface RealTimeMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  lastUpdated: Date;
}

interface LiveActivity {
  id: string;
  type: 'sale' | 'customer' | 'inventory' | 'alert';
  message: string;
  timestamp: Date;
  amount?: number;
}

export function RealTimeMonitor() {
  const { currentStore } = useStore();
  const [isConnected, setIsConnected] = useState(true);
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!currentStore) return;

    // Initialize real-time monitoring
    initializeRealTimeData();
    
    // Set up periodic updates every 30 seconds
    const interval = setInterval(updateRealTimeData, 30000);
    
    // Set up Supabase real-time subscription for orders
    const subscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${currentStore.id}`
        },
        (payload) => {
          handleNewOrder(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [currentStore]);

  const initializeRealTimeData = async () => {
    await updateRealTimeData();
  };

  const updateRealTimeData = async () => {
    if (!currentStore) return;

    try {
      setIsConnected(true);
      
      // Fetch current hour's data
      const now = new Date();
      const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
      
      // Get orders from current hour
      const { data: hourlyOrders } = await supabase
        .from('orders')
        .select('total, created_at, status')
        .eq('store_id', currentStore.id)
        .gte('created_at', hourStart.toISOString());

      // Get recent activities
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, total, created_at, order_number')
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate real-time metrics
      const hourlySales = hourlyOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const hourlyOrderCount = hourlyOrders?.length || 0;
      const averageOrderValue = hourlyOrderCount > 0 ? hourlySales / hourlyOrderCount : 0;
      
      // Update metrics
      const newMetrics: RealTimeMetric[] = [
        {
          id: 'hourly-sales',
          label: 'Hourly Sales',
          value: hourlySales.toFixed(2),
          unit: '$',
          trend: hourlySales > 100 ? 'up' : hourlySales > 50 ? 'stable' : 'down',
          status: hourlySales > 200 ? 'good' : hourlySales > 100 ? 'warning' : 'critical',
          lastUpdated: new Date()
        },
        {
          id: 'orders-per-hour',
          label: 'Orders/Hour',
          value: hourlyOrderCount,
          trend: hourlyOrderCount > 5 ? 'up' : hourlyOrderCount > 2 ? 'stable' : 'down',
          status: hourlyOrderCount > 10 ? 'good' : hourlyOrderCount > 5 ? 'warning' : 'critical',
          lastUpdated: new Date()
        },
        {
          id: 'avg-order-value',
          label: 'Avg Order Value',
          value: averageOrderValue.toFixed(2),
          unit: '$',
          trend: averageOrderValue > 50 ? 'up' : averageOrderValue > 25 ? 'stable' : 'down',
          status: averageOrderValue > 75 ? 'good' : averageOrderValue > 40 ? 'warning' : 'critical',
          lastUpdated: new Date()
        }
      ];

      setMetrics(newMetrics);

      // Update activities
      const newActivities: LiveActivity[] = recentOrders?.map(order => ({
        id: order.id,
        type: 'sale' as const,
        message: `Order ${order.order_number} - $${Number(order.total).toFixed(2)}`,
        timestamp: new Date(order.created_at),
        amount: Number(order.total)
      })) || [];

      setActivities(newActivities);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error updating real-time data:', error);
      setIsConnected(false);
    }
  };

  const handleNewOrder = (order: any) => {
    // Add new order to activities
    const newActivity: LiveActivity = {
      id: order.id,
      type: 'sale',
      message: `New Order ${order.order_number} - $${Number(order.total).toFixed(2)}`,
      timestamp: new Date(order.created_at),
      amount: Number(order.total)
    };

    setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    
    // Update metrics immediately
    updateRealTimeData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-success border-success';
      case 'warning':
        return 'text-orange-500 border-orange-500';
      case 'critical':
        return 'text-destructive border-destructive';
      default:
        return 'text-muted-foreground border-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-success" />;
      case 'down':
        return <TrendingUp className="w-3 h-3 text-destructive rotate-180" />;
      default:
        return <Activity className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="w-4 h-4 text-green-500" />;
      case 'customer':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'inventory':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Real-Time Metrics */}
      <Card className="card-professional">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-blue-500" />
            Live Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="text-success border-success">
                <Wifi className="w-3 h-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="text-destructive border-destructive">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={updateRealTimeData}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-3">
                {getTrendIcon(metric.trend)}
                <div>
                  <p className="font-medium text-foreground">
                    {metric.unit}{metric.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(metric.status)}>
                {metric.status}
              </Badge>
            </div>
          ))}
          
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Activity Feed */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Zap className="w-5 h-5 text-yellow-500" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {activity.amount && (
                  <Badge variant="outline" className="text-success border-success">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {activity.amount.toFixed(2)}
                  </Badge>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No recent activity</p>
              <p className="text-sm text-muted-foreground">Activity will appear here in real-time</p>
            </div>
          )}
          
          <div className="pt-2 border-t border-border">
            <Button variant="outline" size="sm" className="w-full">
              <Activity className="w-4 h-4 mr-2" />
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
