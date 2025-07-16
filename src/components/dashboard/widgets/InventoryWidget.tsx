import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Plus,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';

interface InventoryWidgetProps {
  onViewMore: () => void;
}

interface InventoryData {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  inventoryValue: number;
  inventoryGrowth: number;
  topProducts: Array<{
    id: string;
    name: string;
    stock: number;
    status: 'good' | 'low' | 'out';
    sales: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'restock' | 'sale' | 'adjustment';
    product: string;
    quantity: number;
    time: string;
  }>;
}

export function InventoryWidget({ onViewMore }: InventoryWidgetProps) {
  const { currentStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryData>({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    inventoryValue: 0,
    inventoryGrowth: 0,
    topProducts: [],
    recentActivity: []
  });

  useEffect(() => {
    if (currentStore) {
      fetchInventoryData();
    }
  }, [currentStore]);

  const fetchInventoryData = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);

      // Fetch products with their sales data
      const { data: products } = await supabase
        .from('products')
        .select(`
          id,
          name,
          stock_quantity,
          cost_price,
          selling_price,
          transaction_items (quantity)
        `)
        .eq('store_id', currentStore.id)
        .order('stock_quantity', { ascending: true });

      if (!products || products.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate inventory metrics
      const totalProducts = products.length;
      const lowStockItems = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10).length;
      const outOfStockItems = products.filter(p => p.stock_quantity === 0).length;
      const inventoryValue = products.reduce((sum, p) => sum + (Number(p.cost_price) * p.stock_quantity), 0);

      // Calculate sales for each product
      const productsWithSales = products.map(product => {
        const sales = product.transaction_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        let status = 'good';
        if (product.stock_quantity === 0) status = 'out';
        else if (product.stock_quantity <= 10) status = 'low';

        return {
          id: product.id,
          name: product.name,
          stock: product.stock_quantity,
          status,
          sales
        };
      });

      // Sort by sales for top products
      const topProducts = [...productsWithSales].sort((a, b) => b.sales - a.sales).slice(0, 3);

      // Fetch recent inventory activity
      const { data: recentActivity } = await supabase
        .from('inventory_transactions')
        .select(`
          id,
          type,
          quantity,
          created_at,
          products (name)
        `)
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const formattedActivity = recentActivity?.map(activity => {
        const timeDiff = Date.now() - new Date(activity.created_at).getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const timeString = hoursAgo < 24
          ? `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`
          : `${Math.floor(hoursAgo / 24)} day${Math.floor(hoursAgo / 24) !== 1 ? 's' : ''} ago`;

        return {
          id: activity.id,
          type: activity.type,
          product: activity.products?.name || 'Unknown Product',
          quantity: activity.quantity,
          time: timeString
        };
      }) || [];

      setInventoryData({
        totalProducts,
        lowStockItems,
        outOfStockItems,
        inventoryValue,
        inventoryGrowth: 0, // We don't have historical data for growth calculation
        topProducts,
        recentActivity: formattedActivity
      });
    } catch (error) {
      console.error('Error fetching inventory data:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-success';
      case 'low':
        return 'text-warning';
      case 'out':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge variant="secondary" className="text-xs bg-success/10 text-success">In Stock</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs bg-warning/10 text-warning">Low Stock</Badge>;
      case 'out':
        return <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Inventory Overview</CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
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
              <Package className="w-4 h-4 text-primary" />
            </div>
            Inventory Overview
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
        {/* Main Inventory Metrics */}
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {inventoryData.totalProducts}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Products</span>
              <div className="flex items-center text-xs text-success">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{inventoryData.inventoryGrowth.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-lg font-semibold text-warning">
                {inventoryData.lowStockItems}
              </div>
              <div className="text-xs text-muted-foreground">Low Stock</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-destructive">
                {inventoryData.outOfStockItems}
              </div>
              <div className="text-xs text-muted-foreground">Out of Stock</div>
            </div>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Value</span>
            <span className="text-lg font-semibold text-foreground">
              {formatCurrency(inventoryData.inventoryValue)}
            </span>
          </div>
        </div>

        {/* Top Products */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Stock Status</h4>
            {inventoryData.lowStockItems > 0 && (
              <Badge variant="secondary" className="text-xs bg-warning/10 text-warning">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {inventoryData.lowStockItems} alerts
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            {inventoryData.topProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Stock: {product.stock} • {product.sales} sold
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(product.status)}
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
              <Plus className="w-3 h-3 mr-1" />
              Add Stock
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-8"
              onClick={onViewMore}
            >
              <Eye className="w-3 h-3 mr-1" />
              View All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
