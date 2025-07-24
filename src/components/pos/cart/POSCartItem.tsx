import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/taxUtils';
import { cn } from '@/lib/utils';
import { CartItem } from '@/stores/posStore';

interface POSCartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  className?: string;
}

export function POSCartItem({ item, onUpdateQuantity, className }: POSCartItemProps) {
  const handleQuantityChange = (newQuantity: number) => {
    onUpdateQuantity(item.id, newQuantity);
  };

  return (
    <div className={cn("flex gap-3 p-3 border rounded-lg bg-background hover:bg-muted/30 transition-colors", className)}>
      {/* Product Image */}
      <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${item.image_url ? 'hidden' : ''}`}>
          <Package className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight truncate">
              {item.name}
            </h4>

            {/* Price and Quantity in one line */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                {item.quantity > 1 && (
                  <span className="text-xs text-muted-foreground">
                    ({formatCurrency(item.price)} each)
                  </span>
                )}
              </div>

              {/* Quantity Controls - Compact */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  className="h-6 w-6 p-0"
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">
                  {item.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  className="h-6 w-6 p-0"
                  disabled={item.quantity >= item.stock_quantity}
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(0)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Stock info - smaller */}
            <div className="text-xs text-muted-foreground mt-1">
              Stock: {item.stock_quantity} {item.sku && `• SKU: ${item.sku}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
