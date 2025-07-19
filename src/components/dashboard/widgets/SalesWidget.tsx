import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentStore } from '@/stores/storeStore';
import { useStoreData } from '@/hooks/useSupabaseClient';

interface SalesWidgetProps {
  onViewMore: () => void;
}

interface SalesData {
  todaysSales: number;
  yesterdaysSales: number;
  salesGrowth: number;
  totalOrders: number;
  averageOrderValue: number;
  recentSales: Array<{
    id: string;
    amount: number;
    customer: string;
    time: string;
    items: number;
  }>;
}

export function SalesWidget({ onViewMore }: SalesWidgetProps) {
  const currentStore = useCurrentStore();
  const { from, currentStoreId, isPinSession } = useStoreData();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData>({
    todaysSales: 0,
    yesterdaysSales: 0,
    salesGrowth: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    recentSales: []
  });

  useEffect(() => {
    if (currentStore || (currentStoreId && isPinSession)) {
      fetchSalesData();
    }
  }, [currentStore, currentStoreId, isPinSession]);

  const fetchSalesData = async () => {
    const storeId = currentStoreId || currentStore?.id;
    if (!storeId) return;

    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch today's transactions with error handling
      const { data: todayTransactions, error: todayError } = await from('transactions')
        .select(`
          id,
          total_amount,
          created_at,
          customers (name),
          transaction_items (quantity)
        `)
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      if (todayError) {
        console.error('Error fetching today transactions:', todayError);
        // Set default values and continue
        setSalesData({
          todaysSales: 0,
          yesterdaysSales: 0,
          salesGrowth: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          recentSales: []
        });
        return;
      }

      // Fetch yesterday's transactions for comparison
      const { data: yesterdayTransactions, error: yesterdayError } = await from('transactions')
        .select('total_amount')
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', yesterday)
        .lt('created_at', today);

      if (yesterdayError) {
        console.error('Error fetching yesterday transactions:', yesterdayError);
      }

      const todayTotal = todayTransactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
      const yesterdayTotal = yesterdayTransactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
      const growth = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
      const totalOrders = todayTransactions?.length || 0;
      const averageOrderValue = totalOrders > 0 ? todayTotal / totalOrders : 0;

      // Format recent sales
      const recentSales = todayTransactions?.slice(0, 3).map(transaction => {
        const timeDiff = Date.now() - new Date(transaction.created_at).getTime();
        const minutesAgo = Math.floor(timeDiff / (1000 * 60));
        const timeString = minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.floor(minutesAgo / 60)} hour${Math.floor(minutesAgo / 60) > 1 ? 's' : ''} ago`;

        return {
          id: transaction.id,
          amount: Number(transaction.total_amount),
          customer: transaction.customers?.name || 'Walk-in Customer',
          time: timeString,
          items: transaction.transaction_items?.reduce((sum, item) => sum + item.quantity, 0) || 1
        };
      }) || [];

      setSalesData({
        todaysSales: todayTotal,
        yesterdaysSales: yesterdayTotal,
        salesGrowth: growth,
        totalOrders,
        averageOrderValue,
        recentSales
      });
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        <span>{Math.abs(growth).toFixed(1)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Sales Overview</CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            Sales Overview
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewMore}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Sales Metrics */}
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(salesData.todaysSales)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Today's Sales</span>
              {formatGrowth(salesData.salesGrowth)}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-lg font-semibold text-foreground">
                {salesData.totalOrders}
              </div>
              <div className="text-xs text-muted-foreground">Orders</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">
                {formatCurrency(salesData.averageOrderValue)}
              </div>
              <div className="text-xs text-muted-foreground">Avg. Order</div>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Recent Sales</h4>
            <Badge variant="secondary" className="text-xs">
              {salesData.recentSales.length} today
            </Badge>
          </div>
          
          <div className="space-y-2">
            {salesData.recentSales.slice(0, 3).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{sale.customer}</div>
                  <div className="text-xs text-muted-foreground">{sale.items} items • {sale.time}</div>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatCurrency(sale.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 h-8"
              onClick={onViewMore}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              New Sale
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-8"
              onClick={onViewMore}
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              View All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
