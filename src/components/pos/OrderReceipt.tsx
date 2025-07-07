import { forwardRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Download } from "lucide-react";
import { useTax } from "@/hooks/useTax";

interface ReceiptItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ReceiptProps {
  orderNumber: string;
  orderDate: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  taxAmount: number;
  taxRate: number;
  total: number;
  paymentMethod: string;
  cashierName?: string;
  onPrint?: () => void;
  onDownload?: () => void;
}

export const OrderReceipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({
    orderNumber,
    orderDate,
    storeName,
    storeAddress,
    storePhone,
    customerName,
    customerEmail,
    customerPhone,
    items,
    subtotal,
    discountAmount,
    discountCode,
    taxAmount,
    taxRate,
    total,
    paymentMethod,
    cashierName,
    onPrint,
    onDownload,
  }, ref) => {
    const { formatCurrency } = useTax();

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString();
    };

    return (
      <div className="max-w-md mx-auto">
        <Card className="receipt-card">
          <CardHeader className="text-center pb-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">{storeName}</h2>
              {storeAddress && (
                <p className="text-sm text-muted-foreground">{storeAddress}</p>
              )}
              {storePhone && (
                <p className="text-sm text-muted-foreground">{storePhone}</p>
              )}
            </div>
          </CardHeader>
          
          <CardContent ref={ref} className="receipt-content space-y-4">
            {/* Order Info */}
            <div className="text-center space-y-1">
              <p className="font-medium text-foreground">Order #{orderNumber}</p>
              <p className="text-sm text-muted-foreground">{formatDate(orderDate)}</p>
              {cashierName && (
                <p className="text-sm text-muted-foreground">Cashier: {cashierName}</p>
              )}
            </div>

            <Separator />

            {/* Customer Info */}
            {customerName && (
              <>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Customer:</p>
                  <p className="text-sm text-muted-foreground">{customerName}</p>
                  {customerEmail && (
                    <p className="text-sm text-muted-foreground">{customerEmail}</p>
                  )}
                  {customerPhone && (
                    <p className="text-sm text-muted-foreground">{customerPhone}</p>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Items */}
            <div className="space-y-3">
              <p className="font-medium text-foreground">Items:</p>
              {items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      ${item.total_price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.quantity} × ${item.unit_price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-foreground">{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount {discountCode ? `(${discountCode})` : ''}:
                  </span>
                  <span className="text-success">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax ({(taxRate * 100).toFixed(1)}%):
                  </span>
                  <span className="text-foreground">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">Total:</span>
                <span className="text-foreground">${total.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="text-foreground capitalize">{paymentMethod}</span>
              </div>
            </div>

            <Separator />

            <div className="text-center text-xs text-muted-foreground">
              <p>Thank you for your business!</p>
              <p>Please keep this receipt for your records.</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {(onPrint || onDownload) && (
          <div className="flex gap-2 mt-4">
            {onPrint && (
              <Button onClick={onPrint} variant="outline" className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            )}
            {onDownload && (
              <Button onClick={onDownload} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

OrderReceipt.displayName = "OrderReceipt";
