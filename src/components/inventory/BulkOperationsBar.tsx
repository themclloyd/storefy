import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  X, 
  Trash2, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  ChevronDown,
  Loader2
} from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  is_active: boolean;
}

interface BulkOperationsBarProps {
  selectedProducts: Product[];
  onClearSelection: () => void;
  onProductsUpdated: () => void;
  onBulkStockAdjustment: (products: Product[]) => void;
}

export function BulkOperationsBar({ 
  selectedProducts, 
  onClearSelection, 
  onProductsUpdated,
  onBulkStockAdjustment
}: BulkOperationsBarProps) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const [loading, setLoading] = useState(false);

  if (selectedProducts.length === 0) return null;

  const handleBulkActivate = async () => {
    if (!currentStore || !user) return;

    setLoading(true);
    try {
      const productIds = selectedProducts.map(p => p.id);
      
      const { error } = await supabase
        .from('products')
        .update({ is_active: true })
        .in('id', productIds);

      if (error) throw error;

      toast.success(`${selectedProducts.length} products activated successfully!`);
      onProductsUpdated();
      onClearSelection();
    } catch (error) {
      console.error('Error activating products:', error);
      toast.error('Failed to activate products');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!currentStore || !user) return;

    setLoading(true);
    try {
      const productIds = selectedProducts.map(p => p.id);
      
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .in('id', productIds);

      if (error) throw error;

      toast.success(`${selectedProducts.length} products deactivated successfully!`);
      onProductsUpdated();
      onClearSelection();
    } catch (error) {
      console.error('Error deactivating products:', error);
      toast.error('Failed to deactivate products');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!currentStore || !user) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const productIds = selectedProducts.map(p => p.id);
      
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .in('id', productIds);

      if (error) throw error;

      toast.success(`${selectedProducts.length} products deleted successfully!`);
      onProductsUpdated();
      onClearSelection();
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Failed to delete products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 flex items-center gap-4 min-w-[400px]">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedProducts.length} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBulkStockAdjustment(selectedProducts)}
            disabled={loading}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Adjust Stock
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Actions
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleBulkActivate}>
                <Eye className="h-3 w-3 mr-2" />
                Activate Products
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkDeactivate}>
                <EyeOff className="h-3 w-3 mr-2" />
                Deactivate Products
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleBulkDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete Products
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
