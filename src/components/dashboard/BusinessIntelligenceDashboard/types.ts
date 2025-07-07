export interface BusinessMetrics {
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

export interface BusinessAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
  timestamp: Date;
} 