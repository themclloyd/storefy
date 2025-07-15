import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  ShoppingCart, 
  Clock, 
  Receipt, 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar, 
  ArrowRight, 
  PieChart, 
  CircleDollarSign,
  LayoutDashboard,
  Settings,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Import widget components
import { SalesWidget } from './widgets/SalesWidget';
import { InventoryWidget } from './widgets/InventoryWidget';
import { CustomersWidget } from './widgets/CustomersWidget';
import { LaybyWidget } from './widgets/LaybyWidget';
import { ExpensesWidget } from './widgets/ExpensesWidget';
import { TransactionsWidget } from './widgets/TransactionsWidget';

interface DashboardMetrics {
  // Sales Analytics
  todaysSales: number;
  salesGrowth: number;
  
  // Layby Analytics
  activeLaybys: number;
  laybyValue: number;
  overdueLaybys: number;
  
  // Inventory Analytics
  totalProducts: number;
  lowStockItems: number;
  inventoryValue: number;
  
  // Customer Analytics
  totalCustomers: number;
  newCustomersToday: number;
  
  // Financial Analytics
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

interface IntegratedDashboardProps {
  onViewChange: (view: string) => void;
}

export function IntegratedDashboard({ onViewChange }: IntegratedDashboardProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todaysSales: 0,
    salesGrowth: 0,
    activeLaybys: 0,
    laybyValue: 0,
    overdueLaybys: 0,
    totalProducts: 0,
    lowStockItems: 0,
    inventoryValue: 0,
    totalCustomers: 0,
    newCustomersToday: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0
  });

  useEffect(() => {
    if (currentStore) {
      fetchDashboardData();
    }
  }, [currentStore]);

  const fetchDashboardData = async () => {
    if (!currentStore) return;
    
    try {
      setLoading(true);
      await Promise.all([
        fetchSalesData(),
        fetchLaybyData(),
        fetchInventoryData(),
        fetchCustomerData(),
        fetchExpenseData()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    // Fetch sales data from Supabase
    // This would be implemented with actual data fetching logic
    setMetrics(prev => ({
      ...prev,
      todaysSales: 1250.75,
      salesGrowth: 12.5
    }));
  };

  const fetchLaybyData = async () => {
    // Fetch layby data from Supabase
    setMetrics(prev => ({
      ...prev,
      activeLaybys: 8,
      laybyValue: 2450.00,
      overdueLaybys: 2
    }));
  };

  const fetchInventoryData = async () => {
    // Fetch inventory data from Supabase
    setMetrics(prev => ({
      ...prev,
      totalProducts: 156,
      lowStockItems: 12,
      inventoryValue: 15750.25
    }));
  };

  const fetchCustomerData = async () => {
    // Fetch customer data from Supabase
    setMetrics(prev => ({
      ...prev,
      totalCustomers: 87,
      newCustomersToday: 3
    }));
  };

  const fetchExpenseData = async () => {
    // Fetch expense data from Supabase
    setMetrics(prev => ({
      ...prev,
      totalExpenses: 850.50,
      netProfit: 400.25,
      profitMargin: 32.5
    }));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Format growth percentage
  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        <span>{Math.abs(growth).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {user?.user_metadata?.full_name || 'User'} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with your store today
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Filter</span>
          </Button>
          <Button size="sm" className="h-9">
            <Plus className="w-4 h-4 mr-2" />
            <span>New Sale</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="sales" className="text-sm">Sales</TabsTrigger>
            <TabsTrigger value="inventory" className="text-sm">Inventory</TabsTrigger>
            <TabsTrigger value="customers" className="text-sm">Customers</TabsTrigger>
            <TabsTrigger value="finances" className="text-sm">Finances</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales Card */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sales Today</CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.todaysSales)}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">vs. yesterday</span>
                  {formatGrowth(metrics.salesGrowth)}
                </div>
              </CardContent>
            </Card>

            {/* More cards would be added here */}
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Each widget would be a component */}
            <SalesWidget onViewMore={() => onViewChange('pos')} />
            <InventoryWidget onViewMore={() => onViewChange('inventory')} />
            <CustomersWidget onViewMore={() => onViewChange('customers')} />
            <LaybyWidget onViewMore={() => onViewChange('layby')} />
          </div>
        </TabsContent>

        {/* Other tab contents would be implemented similarly */}
      </Tabs>
    </div>
  );
}
