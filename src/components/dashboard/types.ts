// Dashboard type definitions
export interface DashboardProps {
  onViewChange: (view: string) => void;
}

export interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  onClick?: () => void;
}

export interface ChartPeriod {
  label: string;
  value: 'daily' | 'weekly' | 'monthly';
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  todayLayby: number;
  inventoryValue: number;
  totalExpenses: number;
  todayExpenses: number;
  profit: number;
  profitMargin: number;
  topSellingItems: TopSellingItem[];
  chartData: ChartDataPoint[];
  previousDayComparison: {
    salesChange: number;
    ordersChange: number;
    laybyChange: number;
  };
}

export interface TopSellingItem {
  name: string;
  orders: number;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ChartDataPoint {
  date: string;
  sales: number;
  expenses: number;
  profit: number;
  orders: number;
}

// Store data types
export interface Transaction {
  id: string;
  total: string | number;
  created_at: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  name?: string;
  product_name?: string;
  title?: string;
  quantity: string | number;
}

export interface LaybyOrder {
  id: string;
  total_amount: string | number;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: string | number;
  expense_date: string;
}

export interface Product {
  id: string;
  name: string;
  price: string | number;
  stock_quantity: string | number;
}

export interface StoreData {
  transactions: Transaction[];
  layby_orders: LaybyOrder[];
  products: Product[];
}

// Utility types
export type CurrencyFormatter = (amount: number) => string;
export type ViewChangeHandler = (view: string) => void;
export type ChartPeriodChangeHandler = (period: ChartPeriod['value']) => void;
