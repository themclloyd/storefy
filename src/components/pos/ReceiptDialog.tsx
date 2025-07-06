import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderReceipt } from "./OrderReceipt";
import { toast } from "sonner";

interface ReceiptItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export function ReceiptDialog({
  open,
  onOpenChange,
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
}: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${orderNumber}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  margin: 0;
                  padding: 20px;
                  font-size: 12px;
                  line-height: 1.4;
                }
                .receipt-content {
                  max-width: 300px;
                  margin: 0 auto;
                }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .space-y-1 > * + * { margin-top: 4px; }
                .space-y-2 > * + * { margin-top: 8px; }
                .space-y-3 > * + * { margin-top: 12px; }
                .space-y-4 > * + * { margin-top: 16px; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .items-start { align-items: flex-start; }
                .flex-1 { flex: 1; }
                hr { border: none; border-top: 1px dashed #ccc; margin: 8px 0; }
                .text-sm { font-size: 11px; }
                .text-xs { font-size: 10px; }
                .text-lg { font-size: 14px; }
                @media print {
                  body { margin: 0; padding: 10px; }
                }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const handleDownload = () => {
    if (receiptRef.current) {
      // Create a simple text version of the receipt
      const receiptText = `
${storeName}
${storeAddress || ''}
${storePhone || ''}

Order #${orderNumber}
${new Date(orderDate).toLocaleString()}
${cashierName ? `Cashier: ${cashierName}` : ''}

${customerName ? `Customer: ${customerName}` : ''}
${customerEmail || ''}
${customerPhone || ''}

Items:
${items.map(item => 
  `${item.name} (${item.sku})\n${item.quantity} × $${item.unit_price.toFixed(2)} = $${item.total_price.toFixed(2)}`
).join('\n')}

Subtotal: $${subtotal.toFixed(2)}
${discountAmount > 0 ? `Discount${discountCode ? ` (${discountCode})` : ''}: -$${discountAmount.toFixed(2)}` : ''}
${taxAmount > 0 ? `Tax (${(taxRate * 100).toFixed(1)}%): $${taxAmount.toFixed(2)}` : ''}
Total: $${total.toFixed(2)}
Payment Method: ${paymentMethod}

Thank you for your business!
Please keep this receipt for your records.
      `.trim();

      const blob = new Blob([receiptText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Order Receipt</DialogTitle>
        </DialogHeader>
        
        <OrderReceipt
          ref={receiptRef}
          orderNumber={orderNumber}
          orderDate={orderDate}
          storeName={storeName}
          storeAddress={storeAddress}
          storePhone={storePhone}
          customerName={customerName}
          customerEmail={customerEmail}
          customerPhone={customerPhone}
          items={items}
          subtotal={subtotal}
          discountAmount={discountAmount}
          discountCode={discountCode}
          taxAmount={taxAmount}
          taxRate={taxRate}
          total={total}
          paymentMethod={paymentMethod}
          cashierName={cashierName}
          onPrint={handlePrint}
          onDownload={handleDownload}
        />
      </DialogContent>
    </Dialog>
  );
}
