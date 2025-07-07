import { forwardRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Download } from "lucide-react";
import { useTax } from "@/hooks/useTax";
import { format } from "date-fns";

interface TransactionReceiptItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface TransactionReceiptProps {
  transactionNumber: string;
  transactionDate: string;
  transactionType: string;
  orderNumber?: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: TransactionReceiptItem[];
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  total: number;
  paymentMethod: string;
  cashierName?: string;
  isLayby?: boolean;
  laybyBalance?: number;
  onPrint?: () => void;
  onDownload?: () => void;
}

export const TransactionReceipt = forwardRef<HTMLDivElement, TransactionReceiptProps>(
  ({
    transactionNumber,
    transactionDate,
    transactionType,
    orderNumber,
    storeName,
    storeAddress,
    storePhone,
    customerName,
    customerEmail,
    customerPhone,
    items,
    subtotal,
    discountAmount = 0,
    taxAmount = 0,
    total,
    paymentMethod,
    cashierName,
    isLayby = false,
    laybyBalance = 0,
    onPrint,
    onDownload,
  }, ref) => {
    const { formatCurrency } = useTax();

    const formatDate = (dateString: string) => {
      return format(new Date(dateString), "PPP 'at' p");
    };

    const getTransactionTypeLabel = (type: string) => {
      const typeLabels = {
        sale: 'Sale',
        layby_payment: 'Layby Payment',
        layby_deposit: 'Layby Deposit',
        refund: 'Refund',
        adjustment: 'Adjustment',
        other: 'Other'
      };
      return typeLabels[type as keyof typeof typeLabels] || type;
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
            {/* Transaction Info */}
            <div className="text-center space-y-1">
              <p className="font-medium text-foreground">
                {getTransactionTypeLabel(transactionType)} Receipt
              </p>
              <p className="text-sm font-medium text-foreground">
                Transaction #{transactionNumber}
              </p>
              {orderNumber && (
                <p className="text-sm text-muted-foreground">
                  {isLayby ? 'Layby' : 'Order'} #{orderNumber}
                </p>
              )}
              <p className="text-sm text-muted-foreground">{formatDate(transactionDate)}</p>
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
            {items.length > 0 && (
              <>
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
                          {formatCurrency(item.total_price)}
                        </p>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.quantity} × {formatCurrency(item.unit_price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
              </>
            )}

            {/* Totals */}
            <div className="space-y-2">
              {subtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-foreground">{formatCurrency(subtotal)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="text-success">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="text-foreground">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">
                  {transactionType === 'refund' ? 'Refund Amount:' : 'Total:'}
                </span>
                <span className={`text-foreground ${transactionType === 'refund' ? 'text-red-600' : ''}`}>
                  {transactionType === 'refund' ? '-' : ''}{formatCurrency(total)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="text-foreground capitalize">{paymentMethod.replace('_', ' ')}</span>
              </div>

              {isLayby && laybyBalance > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining Balance:</span>
                  <span className="text-foreground font-medium">{formatCurrency(laybyBalance)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="text-center text-xs text-muted-foreground">
              <p>Thank you for your business!</p>
              <p>Please keep this receipt for your records.</p>
              {transactionType === 'refund' && (
                <p className="mt-2 font-medium">This is a refund receipt.</p>
              )}
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

TransactionReceipt.displayName = "TransactionReceipt";
