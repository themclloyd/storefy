import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/taxUtils';
import { CartSummary as CartSummaryType } from '@/stores/showcaseCartStore';
import { cn } from '@/lib/utils';

interface CartSummaryProps {
  summary: CartSummaryType;
  storeCurrency: string;
  className?: string;
  showItemCount?: boolean;
}

export function CartSummary({ 
  summary, 
  storeCurrency, 
  className,
  showItemCount = true 
}: CartSummaryProps) {
  const formatPrice = (price: number) => {
    return formatCurrency(price, storeCurrency);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showItemCount && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Items ({summary.itemCount})</span>
          <span>{formatPrice(summary.subtotal)}</span>
        </div>
      )}
      
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatPrice(summary.subtotal)}</span>
      </div>
      
      {summary.taxAmount > 0 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Tax</span>
          <span>{formatPrice(summary.taxAmount)}</span>
        </div>
      )}
      
      <Separator />
      
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>{formatPrice(summary.total)}</span>
      </div>
    </div>
  );
}
