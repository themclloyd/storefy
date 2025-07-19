import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  User, 
  Calendar,
  Activity,
  Loader2
} from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  created_at: string;
}

interface StockAdjustment {
  id: string;
  adjustment_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string;
  };
}

interface ProductHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

const adjustmentTypeLabels = {
  manual: 'Manual Adjustment',
  sale: 'Sale',
  return: 'Return',
  damage: 'Damage/Loss',
  restock: 'Restock',
  transfer: 'Transfer',
};

const adjustmentTypeColors = {
  manual: 'default',
  sale: 'destructive',
  return: 'success',
  damage: 'destructive',
  restock: 'success',
  transfer: 'secondary',
} as const;

export function ProductHistoryModal({ open, onOpenChange, product }: ProductHistoryModalProps) {
  const currentStore = useCurrentStore();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product && currentStore) {
      fetchProductHistory();
    }
  }, [open, product, currentStore]);

  const fetchProductHistory = async () => {
    if (!product || !currentStore) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select(`
          id,
          adjustment_type,
          quantity_change,
          previous_quantity,
          new_quantity,
          reason,
          created_at,
          user_id
        `)
        .eq('product_id', product.id)
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching product history:', error);
        toast.error('Failed to load product history');
        return;
      }

      setAdjustments(data || []);
    } catch (error) {
      console.error('Error fetching product history:', error);
      toast.error('Failed to load product history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getAdjustmentIcon = (type: string, change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-success" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    }
  };

  const totalAdjustments = adjustments.length;
  const totalIncrease = adjustments
    .filter(adj => adj.quantity_change > 0)
    .reduce((sum, adj) => sum + adj.quantity_change, 0);
  const totalDecrease = adjustments
    .filter(adj => adj.quantity_change < 0)
    .reduce((sum, adj) => sum + Math.abs(adj.quantity_change), 0);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Product History: {product.name}
          </DialogTitle>
          <DialogDescription>
            Complete history of stock adjustments and changes for this product
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product Name</p>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-medium">{product.sku || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className="font-medium">{product.current_stock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(product.created_at).date}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Adjustments</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAdjustments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Increased</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">+{totalIncrease}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Decreased</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">-{totalDecrease}</div>
              </CardContent>
            </Card>
          </div>

          {/* History Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Stock Adjustment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Loading history...</span>
                  </div>
                ) : adjustments.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <Package className="w-8 h-8 mr-2" />
                    <span>No stock adjustments found</span>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {adjustments.map((adjustment, index) => {
                      const { date, time } = formatDate(adjustment.created_at);
                      const isPositive = adjustment.quantity_change > 0;
                      
                      return (
                        <div key={adjustment.id}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {getAdjustmentIcon(adjustment.adjustment_type, adjustment.quantity_change)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="secondary"
                                  >
                                    {adjustmentTypeLabels[adjustment.adjustment_type as keyof typeof adjustmentTypeLabels]}
                                  </Badge>
                                  <span className={`font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                                    {isPositive ? '+' : ''}{adjustment.quantity_change}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {date} at {time}
                                </div>
                              </div>
                              
                              <div className="text-sm text-muted-foreground mb-2">
                                Stock changed from <span className="font-medium">{adjustment.previous_quantity}</span> to{' '}
                                <span className="font-medium">{adjustment.new_quantity}</span>
                              </div>
                              
                              {adjustment.reason && (
                                <div className="text-sm text-muted-foreground mb-2">
                                  <strong>Reason:</strong> {adjustment.reason}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                {adjustment.profiles?.display_name || 'System User'}
                              </div>
                            </div>
                          </div>
                          
                          {index < adjustments.length - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
