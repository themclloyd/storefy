import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import { useShowcaseCartStore, CartItem as CartItemType } from '@/stores/showcaseCartStore';
import { formatCurrency } from '@/lib/taxUtils';
import { cn } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
  storeCurrency: string;
  themeColors: {
    primary: string;
    secondary: string;
  };
  className?: string;
}

export function CartItem({ item, storeCurrency, themeColors, className }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useShowcaseCartStore();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(item.id);
    } else {
      updateQuantity(item.id, Math.min(newQuantity, item.maxQuantity));
    }
  };

  const formatPrice = (price: number) => {
    return formatCurrency(price, storeCurrency);
  };

  const hasVariants = Object.keys(item.selectedVariants).length > 0;

  return (
    <div className={cn("flex gap-3 p-3 border rounded-lg", className)}>
      {/* Product Image */}
      <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
        {item.productImage ? (
          <img
            src={item.productImage}
            alt={item.productName}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${item.productImage ? 'hidden' : ''}`}>
          <Package className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight truncate">
              {item.productName}
            </h4>
            
            {/* Variants */}
            {hasVariants && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(item.selectedVariants).map(([type, value]) => (
                  <Badge
                    key={`${type}-${value}`}
                    variant="secondary"
                    className="text-xs px-1.5 py-0.5 h-auto"
                  >
                    {type}: {value}
                  </Badge>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="mt-1">
              <span className="font-medium text-sm">
                {formatPrice(item.totalPrice)}
              </span>
              {item.quantity > 1 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({formatPrice((item.basePrice + item.variantAdjustments))} each)
                </span>
              )}
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeFromCart(item.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="h-7 w-7 p-0"
            >
              <Minus className="w-3 h-3" />
            </Button>
            
            <span className="min-w-[2rem] text-center text-sm font-medium">
              {item.quantity}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= item.maxQuantity}
              className="h-7 w-7 p-0"
              style={
                item.quantity < item.maxQuantity
                  ? { borderColor: themeColors.primary, color: themeColors.primary }
                  : {}
              }
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Stock Info */}
          {item.quantity >= item.maxQuantity && (
            <Badge variant="secondary" className="text-xs">
              Max: {item.maxQuantity}
            </Badge>
          )}
        </div>

        {/* Low Stock Warning */}
        {item.stockQuantity <= 5 && item.stockQuantity > 0 && (
          <div className="mt-1">
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
              Only {item.stockQuantity} left
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
