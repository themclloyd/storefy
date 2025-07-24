import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Eye,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { useCurrentStore } from '@/stores/storeStore';
import { useStoreData } from '@/hooks/useSupabaseClient';
import { useTax } from '@/hooks/useTax';
import { InlineLoading } from '@/components/ui/modern-loading';
import { useScreenSize } from '@/hooks/use-mobile';
import { dashboardDesign, responsiveSpacing } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';

// Import new modern components
import { DashboardHeader } from './DashboardHeader';
import { MetricCard, MetricCardsGrid, RevenueCard, OrdersCard, CustomersCard } from './MetricCard';
import { ModernAreaChart, ModernBarChart, ModernPieChart } from './ChartComponents';
import { DashboardGrid, GridItem, DashboardSection, TwoColumnLayout } from './DashboardGrid';
import { QuickActionsPanel } from './QuickActionsPanel';
import { MobileDashboard } from './MobileDashboard';
import { DashboardInsights } from './DashboardInsights';
import { DashboardCustomization } from './DashboardCustomization';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { DashboardWidgetRenderer, getWidgetGridClasses } from './DashboardWidgetRenderer';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockItems: number;
  todayRevenue: number;
  todayOrders: number;
  recentTransactions: Array<{
    id: string;
    amount: number;
    customer: string;
    time: string;
    items: number;
  }>;
  salesByCategory: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  weeklyRevenue: Array<{
    day: string;
    revenue: number;
    orders: number;
  }>;
}

export function SimpleDashboard({ onViewChange }: DashboardProps) {
  const currentStore = useCurrentStore();
  const { from, currentStoreId, isPinSession } = useStoreData();
  const { formatCurrency } = useTax();
  const { isMobile, isTablet } = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockItems: 0,
    todayRevenue: 0,
    todayOrders: 0,
    recentTransactions: [],
    salesByCategory: [],
    weeklyRevenue: []
  });

  // Dashboard layout management
  const {
    currentLayout,
    saveLayout,
    setCurrentLayout
  } = useDashboardLayout();

  useEffect(() => {
    if ((currentStore && !isPinSession) || (currentStoreId && isPinSession)) {
      fetchDashboardData();
    }
  }, [currentStore, currentStoreId, isPinSession]);

  // Auto-refresh based on layout settings
  useEffect(() => {
    if (currentLayout.refreshInterval === 0) return; // No auto-refresh

    const interval = setInterval(() => {
      if ((currentStore && !isPinSession) || (currentStoreId && isPinSession)) {
        fetchDashboardData(true);
      }
    }, currentLayout.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [currentStore, currentStoreId, isPinSession, currentLayout.refreshInterval]);

  const handleRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, []);

  const handleExport = useCallback(() => {
    // Export dashboard data as CSV or PDF
    console.log('Exporting dashboard data...');
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    const storeId = currentStoreId || currentStore?.id;
    if (!storeId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const today = new Date().toISOString().split('T')[0];

      // Fetch basic counts
      const [
        { count: totalCustomers },
        { count: totalProducts },
        { count: totalOrders },
        { count: lowStockItems }
      ] = await Promise.all([
        from('customers').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
        from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('is_active', true),
        from('transactions').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
        from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).lt('stock_quantity', 10)
      ]);

      // Fetch revenue data
      const { data: transactions } = await from('transactions')
        .select('amount, created_at, customer_name')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(100);

      const totalRevenue = transactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
      const todayTransactions = transactions?.filter(t => t.created_at.startsWith(today)) || [];
      const todayRevenue = todayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const todayOrders = todayTransactions.length;

      // Format recent transactions
      const recentTransactions = (transactions?.slice(0, 5) || []).map((t, index) => ({
        id: `txn-${index}`,
        amount: Number(t.amount) || 0,
        customer: t.customer_name || 'Walk-in Customer',
        time: new Date(t.created_at).toLocaleTimeString(),
        items: 1 // Simplified
      }));

      // Fetch category sales data for pie chart
      const { data: categoryData } = await from('products')
        .select(`
          categories (name),
          stock_quantity
        `)
        .eq('store_id', storeId)
        .eq('is_active', true);

      // Process category data for pie chart
      const categoryStats = categoryData?.reduce((acc, product) => {
        const categoryName = product.categories?.name || 'Uncategorized';
        const stock = product.stock_quantity || 0;
        acc[categoryName] = (acc[categoryName] || 0) + stock;
        return acc;
      }, {} as Record<string, number>) || {};

      const colors = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent-foreground))', 'hsl(var(--secondary-foreground))', 'hsl(var(--destructive))', 'hsl(var(--border))'];
      const salesByCategory = Object.entries(categoryStats)
        .slice(0, 6)
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }));

      // Generate weekly revenue data for bar chart
      const weeklyRevenue = [];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayTransactions = transactions?.filter(t =>
          new Date(t.created_at).toDateString() === date.toDateString()
        ) || [];

        weeklyRevenue.push({
          day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
          revenue: dayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
          orders: dayTransactions.length
        });
      }

      setStats({
        totalRevenue,
        totalOrders: totalOrders || 0,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        lowStockItems: lowStockItems || 0,
        todayRevenue,
        todayOrders,
        recentTransactions,
        salesByCategory,
        weeklyRevenue
      });

      // Update last updated timestamp
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <InlineLoading text="Loading dashboard..." size="lg" />
      </div>
    );
  }

  // Prepare chart data
  const revenueChartData = stats.weeklyRevenue.map(item => ({
    name: item.day,
    revenue: item.revenue,
    orders: item.orders
  }));

  const categoryChartData = stats.salesByCategory.map(item => ({
    name: item.name,
    value: item.value,
    color: item.color
  }));

  // Mobile-first approach
  if (isMobile) {
    return (
      <div className="h-full w-full overflow-auto">
        <DashboardHeader
          title="Dashboard"
          onRefresh={handleRefresh}
          onExport={handleExport}
          isLoading={refreshing}
          lastUpdated={lastUpdated}
        />
        <div className="w-full px-4 py-4">
          <MobileDashboard
            stats={stats}
            formatCurrency={formatCurrency}
            onViewChange={onViewChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto">
      {/* Modern Dashboard Header */}
      <DashboardHeader
        title="Dashboard"
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={refreshing}
        lastUpdated={lastUpdated}
        customizationComponent={
          <DashboardCustomization
            currentLayout={currentLayout}
            onLayoutChange={setCurrentLayout}
            onSaveLayout={saveLayout}
          />
        }
      />

      {/* Main Dashboard Content */}
      <div className="flex-1 w-full px-6 py-6">
        {/* Dynamic Widget Grid based on Layout */}
        <div className={cn(
          'grid gap-6',
          currentLayout.compactMode ? 'gap-4' : 'gap-6',
          'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        )}>
          {currentLayout.widgets
            .filter(widget => widget.enabled)
            .sort((a, b) => {
              // Sort by row first, then by column
              if (a.position.row !== b.position.row) {
                return a.position.row - b.position.row;
              }
              return a.position.col - b.position.col;
            })
            .map((widget) => (
              <div
                key={widget.id}
                className={getWidgetGridClasses(widget)}
              >
                <DashboardWidgetRenderer
                  widget={widget}
                  stats={stats}
                  formatCurrency={formatCurrency}
                  onViewChange={onViewChange}
                  onRefresh={handleRefresh}
                  onExport={handleExport}
                />
              </div>
            ))}
        </div>

        {/* Additional Sections for non-mobile */}
        {!isMobile && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div>
              <QuickActionsPanel onViewChange={onViewChange} />
            </div>

            {/* AI Insights */}
            <div>
              <DashboardInsights
                stats={stats}
                formatCurrency={formatCurrency}
                onViewChange={onViewChange}
              />
            </div>

            {/* Additional Metrics or Charts */}
            <div className="space-y-6">
              <MetricCard
                title="Average Order Value"
                value={stats.totalOrders > 0 ? formatCurrency(stats.totalRevenue / stats.totalOrders) : formatCurrency(0)}
                change={{
                  value: 5.2,
                  period: 'last month',
                  trend: 'up'
                }}
                icon={DollarSign}
                color="success"
                description="Per transaction average"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
