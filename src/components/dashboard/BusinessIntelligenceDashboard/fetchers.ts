import { BusinessMetrics, BusinessAlert } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// All fetcher and helper functions from the original file, exported as named async functions.
// These functions should receive the necessary arguments (e.g., currentStore, metrics, setMetrics, setAlerts, setRecentOrders, setLastUpdated, setLoading, user) as parameters.
// ... (functions to be filled in after initial file split) 

export async function fetchSalesIntelligence(currentStore: any, metrics: BusinessMetrics, setMetrics: (fn: (prev: BusinessMetrics) => BusinessMetrics) => void) {
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
}

export async function fetchInventoryIntelligence(currentStore: any, metrics: BusinessMetrics, setMetrics: (fn: (prev: BusinessMetrics) => BusinessMetrics) => void) {
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
}

export async function fetchCustomerIntelligence(currentStore: any, setMetrics: (fn: (prev: BusinessMetrics) => BusinessMetrics) => void) {
  if (!currentStore) return;

  const { data: customers } = await supabase
    .from('customers')
    .select('id, status, total_spent, total_orders, created_at')
    .eq('store_id', currentStore.id);

  if (!customers) return;

  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  
  const totalCustomers = customers.length;
  const newCustomersToday = customers.filter(c => new Date(c.created_at) >= todayStart).length;
  const vipCustomers = customers.filter(c => c.status === 'vip').length;
  const averageCustomerValue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / totalCustomers;
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
}

export async function fetchOperationalIntelligence(currentStore: any, setMetrics: (fn: (prev: BusinessMetrics) => BusinessMetrics) => void) {
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
}

export async function fetchRecentOrders(currentStore: any, setRecentOrders: (orders: any[]) => void) {
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
}

export async function generateBusinessAlerts(metrics: BusinessMetrics, setAlerts: (alerts: BusinessAlert[]) => void) {
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
} 