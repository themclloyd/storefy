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
    try {
      setLoading(true);
      // Mock data for now - replace with actual Supabase queries
      setInventoryData({
        totalProducts: 156,
        lowStockItems: 12,
        outOfStockItems: 3,
        inventoryValue: 15750.25,
        inventoryGrowth: 8.2,
        topProducts: [
          {
            id: '1',
            name: 'Wireless Headphones',
            stock: 25,
            status: 'good',
            sales: 45
          },
          {
            id: '2',
            name: 'Phone Case',
            stock: 5,
            status: 'low',
            sales: 32
          },
          {
            id: '3',
            name: 'USB Cable',
            stock: 0,
            status: 'out',
            sales: 28
          }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'restock',
            product: 'Wireless Headphones',
            quantity: 20,
            time: '1 hour ago'
          },
          {
            id: '2',
            type: 'sale',
            product: 'Phone Case',
            quantity: -2,
            time: '2 hours ago'
          }
        ]
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
