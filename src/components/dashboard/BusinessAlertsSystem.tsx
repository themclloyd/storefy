import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingDown,
  Package,
  Users,
  DollarSign,
  Target,
  Zap,
  Eye,
  X,
  ArrowRight,
  Calendar,
  AlertCircle
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BusinessAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success' | 'opportunity';
  category: 'inventory' | 'sales' | 'customers' | 'operations' | 'financial';
  title: string;
  message: string;
  details?: string;
  action?: {
    label: string;
    handler: () => void;
  };
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  dismissed?: boolean;
  autoResolve?: boolean;
  resolveCondition?: string;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  category: string;
}

export function BusinessAlertsSystem() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<BusinessAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentStore && user) {
      initializeAlertSystem();
      // Check for alerts every 2 minutes
      const interval = setInterval(checkBusinessAlerts, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [currentStore, user]);

  const initializeAlertSystem = async () => {
    // Initialize default alert rules
    const defaultRules: AlertRule[] = [
      {
        id: 'low-stock',
        name: 'Low Stock Alert',
        condition: 'stock_quantity <= low_stock_threshold',
        threshold: 5,
        enabled: true,
        category: 'inventory'
      },
      {
        id: 'out-of-stock',
        name: 'Out of Stock Alert',
        condition: 'stock_quantity = 0',
        threshold: 0,
        enabled: true,
        category: 'inventory'
      },
      {
        id: 'sales-target-behind',
        name: 'Sales Target Behind',
        condition: 'daily_sales < target * 0.5 AND hour > 15',
        threshold: 50,
        enabled: true,
        category: 'sales'
      },
      {
        id: 'high-refund-rate',
        name: 'High Refund Rate',
        condition: 'refund_rate > 10',
        threshold: 10,
        enabled: true,
        category: 'operations'
      },
      {
        id: 'customer-churn',
        name: 'Customer Churn Risk',
        condition: 'days_since_last_order > 30',
        threshold: 30,
        enabled: true,
        category: 'customers'
      },
      {
        id: 'profit-margin-low',
        name: 'Low Profit Margin',
        condition: 'profit_margin < 15',
        threshold: 15,
        enabled: true,
        category: 'financial'
      }
    ];

    setAlertRules(defaultRules);
    await checkBusinessAlerts();
    setLoading(false);
  };

  const checkBusinessAlerts = async () => {
    if (!currentStore) return;

    const newAlerts: BusinessAlert[] = [];

    try {
      // Check inventory alerts
      await checkInventoryAlerts(newAlerts);
      
      // Check sales alerts
      await checkSalesAlerts(newAlerts);
      
      // Check customer alerts
      await checkCustomerAlerts(newAlerts);
      
      // Check operational alerts
      await checkOperationalAlerts(newAlerts);
      
      // Check financial alerts
      await checkFinancialAlerts(newAlerts);
      
      // Check for business opportunities
      await checkBusinessOpportunities(newAlerts);

      // Update alerts state
      setAlerts(prev => {
        const existingIds = prev.map(a => a.id);
        const uniqueNewAlerts = newAlerts.filter(a => !existingIds.includes(a.id));
        return [...prev.filter(a => !a.dismissed), ...uniqueNewAlerts];
      });

    } catch (error) {
      console.error('Error checking business alerts:', error);
    }
  };

  const checkInventoryAlerts = async (alerts: BusinessAlert[]) => {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock_quantity, low_stock_threshold')
      .eq('store_id', currentStore!.id)
      .eq('is_active', true);

    if (!products) return;

    // Low stock alerts
    const lowStockProducts = products.filter(p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0);
    if (lowStockProducts.length > 0) {
      alerts.push({
        id: 'low-stock-' + Date.now(),
        type: 'warning',
        category: 'inventory',
        title: 'Low Stock Alert',
        message: `${lowStockProducts.length} products are running low on stock`,
        details: lowStockProducts.map(p => `${p.name} (${p.stock_quantity} left)`).join(', '),
        priority: 'medium',
        timestamp: new Date(),
        action: {
          label: 'View Inventory',
          handler: () => window.location.href = '/inventory'
        }
      });
    }

    // Out of stock alerts
    const outOfStockProducts = products.filter(p => p.stock_quantity === 0);
    if (outOfStockProducts.length > 0) {
      alerts.push({
        id: 'out-of-stock-' + Date.now(),
        type: 'critical',
        category: 'inventory',
        title: 'Out of Stock Alert',
        message: `${outOfStockProducts.length} products are out of stock`,
        details: outOfStockProducts.map(p => p.name).join(', '),
        priority: 'high',
        timestamp: new Date(),
        action: {
          label: 'Restock Now',
          handler: () => window.location.href = '/inventory'
        }
      });
    }
  };

  const checkSalesAlerts = async (alerts: BusinessAlert[]) => {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();

    const { data: todaysOrders } = await supabase
      .from('orders')
      .select('total')
      .eq('store_id', currentStore!.id)
      .eq('status', 'completed')
      .gte('created_at', todayStart);

    const todaysSales = todaysOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
    const salesTarget = 1000; // This should come from settings
    const currentHour = new Date().getHours();

    // Sales target behind alert
    if (todaysSales < salesTarget * 0.5 && currentHour > 15) {
      alerts.push({
        id: 'sales-behind-' + Date.now(),
        type: 'warning',
        category: 'sales',
        title: 'Sales Behind Target',
        message: `Sales are ${((salesTarget - todaysSales) / salesTarget * 100).toFixed(0)}% behind today's target`,
        details: `Current: $${todaysSales.toFixed(2)} | Target: $${salesTarget.toFixed(2)}`,
        priority: 'medium',
        timestamp: new Date(),
        action: {
          label: 'View Strategies',
          handler: () => toast.info('Sales strategies feature coming soon!')
        }
      });
    }

    // Sales target achieved
    if (todaysSales >= salesTarget) {
      alerts.push({
        id: 'sales-target-achieved-' + Date.now(),
        type: 'success',
        category: 'sales',
        title: 'Sales Target Achieved!',
        message: 'Congratulations! You\'ve reached today\'s sales target',
        priority: 'low',
        timestamp: new Date(),
        autoResolve: true
      });
    }
  };

  const checkCustomerAlerts = async (alerts: BusinessAlert[]) => {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, status, total_spent, created_at')
      .eq('store_id', currentStore!.id);

    if (!customers) return;

    // VIP customer opportunities
    const potentialVips = customers.filter(c => c.total_spent > 500 && c.status !== 'vip');
    if (potentialVips.length > 0) {
      alerts.push({
        id: 'vip-opportunity-' + Date.now(),
        type: 'opportunity',
        category: 'customers',
        title: 'VIP Customer Opportunity',
        message: `${potentialVips.length} customers qualify for VIP status`,
        details: potentialVips.map(c => `${c.name} ($${c.total_spent})`).join(', '),
        priority: 'low',
        timestamp: new Date(),
        action: {
          label: 'Upgrade to VIP',
          handler: () => window.location.href = '/customers'
        }
      });
    }
  };

  const checkOperationalAlerts = async (alerts: BusinessAlert[]) => {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();

    const { data: orders } = await supabase
      .from('orders')
      .select('status')
      .eq('store_id', currentStore!.id)
      .gte('created_at', todayStart);

    if (!orders) return;

    const totalOrders = orders.length;
    const refundedOrders = orders.filter(o => o.status === 'refunded').length;
    const refundRate = totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0;

    // High refund rate alert
    if (refundRate > 10 && totalOrders > 5) {
      alerts.push({
        id: 'high-refunds-' + Date.now(),
        type: 'warning',
        category: 'operations',
        title: 'High Refund Rate',
        message: `Refund rate is ${refundRate.toFixed(1)}% today`,
        details: `${refundedOrders} refunds out of ${totalOrders} orders`,
        priority: 'medium',
        timestamp: new Date(),
        action: {
          label: 'Investigate',
          handler: () => window.location.href = '/reports'
        }
      });
    }
  };

  const checkFinancialAlerts = async (alerts: BusinessAlert[]) => {
    // This would typically check cash flow, profit margins, etc.
    // For now, we'll create a placeholder alert
    const currentHour = new Date().getHours();
    
    if (currentHour === 17) { // End of business day
      alerts.push({
        id: 'daily-summary-' + Date.now(),
        type: 'info',
        category: 'financial',
        title: 'Daily Summary Available',
        message: 'Your daily financial summary is ready for review',
        priority: 'low',
        timestamp: new Date(),
        action: {
          label: 'View Summary',
          handler: () => window.location.href = '/reports'
        }
      });
    }
  };

  const checkBusinessOpportunities = async (alerts: BusinessAlert[]) => {
    // Check for business opportunities like peak sales times, trending products, etc.
    const currentHour = new Date().getHours();
    
    // Peak hours opportunity
    if (currentHour >= 11 && currentHour <= 13) {
      alerts.push({
        id: 'peak-hours-' + Date.now(),
        type: 'opportunity',
        category: 'sales',
        title: 'Peak Hours Active',
        message: 'This is typically your busiest time - maximize sales!',
        priority: 'low',
        timestamp: new Date(),
        autoResolve: true
      });
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'opportunity':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-l-destructive bg-destructive/5';
      case 'warning':
        return 'border-l-warning bg-warning/5';
      case 'success':
        return 'border-l-success bg-success/5';
      case 'opportunity':
        return 'border-l-quaternary bg-quaternary/5';
      default:
        return 'border-l-primary bg-primary/5';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'inventory':
        return <Package className="w-4 h-4" />;
      case 'sales':
        return <DollarSign className="w-4 h-4" />;
      case 'customers':
        return <Users className="w-4 h-4" />;
      case 'operations':
        return <Target className="w-4 h-4" />;
      case 'financial':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.dismissed);
  const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical');
  const warningAlerts = activeAlerts.filter(alert => alert.type === 'warning');
  const opportunityAlerts = activeAlerts.filter(alert => alert.type === 'opportunity');

  if (loading) {
    return (
      <Card className="card-professional">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-muted-foreground">Loading alerts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-professional">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl font-bold text-destructive">{criticalAlerts.length}</p>
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
            <XCircle className="w-8 h-8 text-destructive" />
          </CardContent>
        </Card>
        
        <Card className="card-professional">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl font-bold text-orange-500">{warningAlerts.length}</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </CardContent>
        </Card>
        
        <Card className="card-professional">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl font-bold text-yellow-500">{opportunityAlerts.length}</p>
              <p className="text-sm text-muted-foreground">Opportunities</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </CardContent>
        </Card>
        
        <Card className="card-professional">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{activeAlerts.length}</p>
              <p className="text-sm text-muted-foreground">Total Active</p>
            </div>
            <Bell className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 ? (
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bell className="w-5 h-5 text-primary" />
              Active Business Alerts ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeAlerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{alert.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryIcon(alert.category)}
                          <span className="ml-1">{alert.category}</span>
                        </Badge>
                        <Badge variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'default' : 'secondary'}>
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      {alert.details && (
                        <p className="text-xs text-muted-foreground">{alert.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.action && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={alert.action.handler}
                      >
                        {alert.action.label}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="card-professional">
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-foreground font-medium">All Clear!</p>
              <p className="text-sm text-muted-foreground">No active business alerts</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
