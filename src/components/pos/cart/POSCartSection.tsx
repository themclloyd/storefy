import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, DollarSign, User, Trash2, UserPlus, Percent, X } from 'lucide-react';
import { POSCartItem } from './POSCartItem';
import { CartItem, Customer } from '@/stores/posStore';
import { formatCurrency } from '@/lib/taxUtils';
import { cn } from '@/lib/utils';

interface POSCartSectionProps {
  cart: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  selectedCustomer: Customer | null;
  paymentMethod: string | null;
  discountValue: string;
  discountType: "percent" | "fixed";
  discountCode: string;
  isProcessingOrder: boolean;
  customers: Customer[];
  paymentOptions: Array<{
    id: string;
    name: string;
    type: 'cash' | 'card';
    provider?: string;
  }>;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onClearCart: () => void;
  onSetSelectedCustomer: (customer: Customer | null) => void;
  onSetPaymentMethod: (method: string) => void;
  onSetDiscountValue: (value: string) => void;
  onSetDiscountType: (type: "percent" | "fixed") => void;
  onSetDiscountCode: (code: string) => void;
  onProcessOrder: () => void;
  className?: string;
}

export function POSCartSection({
  cart,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  selectedCustomer,
  paymentMethod,
  discountValue,
  discountType,
  discountCode,
  isProcessingOrder,
  customers,
  paymentOptions,
  onUpdateQuantity,
  onClearCart,
  onSetSelectedCustomer,
  onSetPaymentMethod,
  onSetDiscountValue,
  onSetDiscountType,
  onSetDiscountCode,
  onProcessOrder,
  className
}: POSCartSectionProps) {
  const isOrderValid = () => {
    return cart.length > 0 && selectedCustomer && paymentMethod &&
           cart.every(item => item.quantity <= item.stock_quantity && item.stock_quantity > 0);
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={cn("flex flex-col h-full bg-background border rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Cart</h3>
          {cart.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {cart.length}
            </Badge>
          )}
        </div>
        {cart.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Add products to get started</p>
            </div>
          </div>
        ) : (
          <>
            {/* Customer & Discount Icons Row */}
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
              {/* Customer Icon */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {selectedCustomer ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {selectedCustomer.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSetSelectedCustomer(null)}
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value=""
                      onValueChange={(value) => {
                        const customer = customers.find(c => c.id === value);
                        onSetSelectedCustomer(customer || null);
                      }}
                    >
                      <SelectTrigger className="h-6 w-auto border-none bg-transparent p-0 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                {customer.phone && (
                                  <div className="text-xs text-muted-foreground">{customer.phone}</div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <Separator orientation="vertical" className="h-4" />

              {/* Discount Icon */}
              <div className="flex items-center gap-1">
                <Percent className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-1">
                  <Select value={discountType} onValueChange={onSetDiscountType}>
                    <SelectTrigger className="h-6 w-8 border-none bg-transparent p-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="fixed">$</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="0"
                    value={discountValue}
                    onChange={(e) => onSetDiscountValue(e.target.value)}
                    className="h-6 w-12 border-none bg-transparent p-0 text-xs text-center"
                  />
                </div>
              </div>

              <Separator orientation="vertical" className="h-4" />

              {/* Payment Method Icon */}
              <div className="flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <Select value={paymentMethod || ""} onValueChange={onSetPaymentMethod}>
                  <SelectTrigger className="h-6 w-auto border-none bg-transparent p-0 text-sm">
                    <SelectValue placeholder="Payment">
                      {paymentMethod && (
                        <span className="text-xs">
                          {paymentOptions.find(opt => opt.id === paymentMethod)?.name || paymentMethod}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-2">
                          {option.type === 'cash' ? (
                            <DollarSign className="w-4 h-4" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                          <span>{option.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2 p-4">
                  {cart.map((item) => (
                    <POSCartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Cart Summary & Checkout - Fixed Bottom */}
            <div className="flex-shrink-0 border-t bg-background">
              {/* Summary */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Items ({itemCount})</span>
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
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Process Order Button */}
              <div className="p-4 pt-0">
                <Button
                  onClick={onProcessOrder}
                  disabled={!isOrderValid() || isProcessingOrder}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isProcessingOrder ? 'Processing...' : `Complete Order`}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
  );
}
