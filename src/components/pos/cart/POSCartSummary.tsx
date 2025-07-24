import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/taxUtils';
import { cn } from '@/lib/utils';

interface POSCartSummaryProps {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  itemCount: number;
  className?: string;
  showItemCount?: boolean;
}

export function POSCartSummary({ 
  subtotal,
  discountAmount,
  taxAmount,
  total,
  itemCount,
  className,
  showItemCount = true 
}: POSCartSummaryProps) {
  return (
    <div className={cn("space-y-2 p-4 bg-muted/30 rounded-lg", className)}>
      {showItemCount && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Items ({itemCount})</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      )}
      
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>
      )}
      
      {taxAmount > 0 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Tax</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
      )}
      
      <Separator />
      
      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
