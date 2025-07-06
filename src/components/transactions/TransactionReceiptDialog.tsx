import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TransactionReceipt } from "./TransactionReceipt";
import { toast } from "sonner";

interface TransactionReceiptItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface TransactionReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export function TransactionReceiptDialog({
  open,
  onOpenChange,
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
}: TransactionReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${transactionNumber}</title>
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
                .text-red-600 { color: #dc2626; }
                .text-green-600 { color: #16a34a; }
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

${transactionType.toUpperCase()} RECEIPT
Transaction #${transactionNumber}
${orderNumber ? `${isLayby ? 'Layby' : 'Order'} #${orderNumber}` : ''}
${new Date(transactionDate).toLocaleString()}
${cashierName ? `Cashier: ${cashierName}` : ''}

${customerName ? `Customer: ${customerName}` : ''}
${customerEmail || ''}
${customerPhone || ''}

${items.length > 0 ? 'Items:' : ''}
${items.map(item => 
  `${item.name} (${item.sku})\n${item.quantity} × $${item.unit_price.toFixed(2)} = $${item.total_price.toFixed(2)}`
).join('\n')}

${subtotal > 0 ? `Subtotal: $${subtotal.toFixed(2)}` : ''}
${discountAmount > 0 ? `Discount: -$${discountAmount.toFixed(2)}` : ''}
${taxAmount > 0 ? `Tax: $${taxAmount.toFixed(2)}` : ''}
${transactionType === 'refund' ? 'Refund Amount' : 'Total'}: ${transactionType === 'refund' ? '-' : ''}$${total.toFixed(2)}
Payment Method: ${paymentMethod.replace('_', ' ')}
${isLayby && laybyBalance > 0 ? `Remaining Balance: $${laybyBalance.toFixed(2)}` : ''}

Thank you for your business!
Please keep this receipt for your records.
${transactionType === 'refund' ? 'This is a refund receipt.' : ''}
      `.trim();

      const blob = new Blob([receiptText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transactionNumber}.txt`;
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
          <DialogTitle>Transaction Receipt</DialogTitle>
          <DialogDescription>
            Print or download the receipt for this transaction.
          </DialogDescription>
        </DialogHeader>
        
        <TransactionReceipt
          ref={receiptRef}
          transactionNumber={transactionNumber}
          transactionDate={transactionDate}
          transactionType={transactionType}
          orderNumber={orderNumber}
          storeName={storeName}
          storeAddress={storeAddress}
          storePhone={storePhone}
          customerName={customerName}
          customerEmail={customerEmail}
          customerPhone={customerPhone}
          items={items}
          subtotal={subtotal}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          total={total}
          paymentMethod={paymentMethod}
          cashierName={cashierName}
          isLayby={isLayby}
          laybyBalance={laybyBalance}
          onPrint={handlePrint}
          onDownload={handleDownload}
        />
      </DialogContent>
    </Dialog>
  );
}
