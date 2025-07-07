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
import jsPDF from 'jspdf';

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
                  padding: 10px;
                  font-size: 12px;
                  line-height: 1.3;
                  width: 80mm;
                  max-width: 80mm;
                }
                .receipt-content {
                  width: 100%;
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
                hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
                .text-sm { font-size: 11px; }
                .text-xs { font-size: 10px; }
                .text-lg { font-size: 14px; }
                .text-red-600 { color: #dc2626; }
                .text-green-600 { color: #16a34a; }
                .no-print { display: block; }
                @media print {
                  body {
                    margin: 0;
                    padding: 5px;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                  }
                  .no-print { display: none !important; }
                  @page {
                    size: 80mm auto;
                    margin: 0;
                  }
                }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();

        // Wait for content to load before printing
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);

        toast.success('Receipt sent to printer');
      }
    }
  };

  const handleDownload = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Thermal receipt size (80mm wide)
      });

      // Set font
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);

      let yPosition = 10;
      const lineHeight = 4;
      const pageWidth = 80;
      const margin = 5;

      // Helper function to add text
      const addText = (text: string, fontSize = 10, align: 'left' | 'center' = 'left') => {
        doc.setFontSize(fontSize);
        if (align === 'center') {
          const textWidth = doc.getTextWidth(text);
          const x = (pageWidth - textWidth) / 2;
          doc.text(text, x, yPosition);
        } else {
          doc.text(text, margin, yPosition);
        }
        yPosition += lineHeight;
      };

      // Store header
      addText(storeName, 12, 'center');
      if (storeAddress) addText(storeAddress, 8, 'center');
      if (storePhone) addText(storePhone, 8, 'center');

      yPosition += 2;
      addText('================================', 8, 'center');
      yPosition += 2;

      // Transaction info
      addText(`${transactionType.toUpperCase()} RECEIPT`, 11, 'center');
      addText(`Transaction #${transactionNumber}`, 10, 'center');
      if (orderNumber) {
        addText(`${isLayby ? 'Layby' : 'Order'} #${orderNumber}`, 9, 'center');
      }
      addText(new Date(transactionDate).toLocaleString(), 8, 'center');
      if (cashierName) addText(`Cashier: ${cashierName}`, 8);

      yPosition += 2;

      // Customer info
      if (customerName) {
        addText(`Customer: ${customerName}`, 8);
        if (customerEmail) addText(`Email: ${customerEmail}`, 8);
        if (customerPhone) addText(`Phone: ${customerPhone}`, 8);
        yPosition += 2;
      }

      if (items.length > 0) {
        addText('================================', 8, 'center');
        yPosition += 2;

        // Items
        items.forEach(item => {
          addText(`${item.name}`, 9);
          addText(`${item.sku}`, 8);
          addText(`${item.quantity} x $${item.unit_price.toFixed(2)} = $${item.total_price.toFixed(2)}`, 8);
          yPosition += 1;
        });

        yPosition += 2;
        addText('================================', 8, 'center');
        yPosition += 2;

        // Totals
        if (subtotal > 0) addText(`Subtotal: $${subtotal.toFixed(2)}`, 9);
        if (discountAmount && discountAmount > 0) {
          addText(`Discount: -$${discountAmount.toFixed(2)}`, 9);
        }
        if (taxAmount && taxAmount > 0) {
          addText(`Tax: $${taxAmount.toFixed(2)}`, 9);
        }
      }

      const totalLabel = transactionType === 'refund' ? 'REFUND AMOUNT' : 'TOTAL';
      const totalAmount = transactionType === 'refund' ? `-$${total.toFixed(2)}` : `$${total.toFixed(2)}`;
      addText(`${totalLabel}: ${totalAmount}`, 11);
      addText(`Payment: ${paymentMethod.replace('_', ' ')}`, 9);

      if (isLayby && laybyBalance && laybyBalance > 0) {
        addText(`Remaining Balance: $${laybyBalance.toFixed(2)}`, 9);
      }

      yPosition += 4;
      addText('================================', 8, 'center');
      yPosition += 2;
      addText('Thank you for your business!', 9, 'center');
      addText('Please keep this receipt', 8, 'center');
      addText('for your records.', 8, 'center');

      if (transactionType === 'refund') {
        yPosition += 2;
        addText('This is a refund receipt.', 8, 'center');
      }

      // Save the PDF
      doc.save(`receipt-${transactionNumber}.pdf`);
      toast.success('Receipt PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF receipt');
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
