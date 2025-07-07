import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderReceipt } from "./OrderReceipt";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import { useTax } from "@/hooks/useTax";

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
  const { formatCurrency } = useTax();

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

      // Order info
      addText(`Order #${orderNumber}`, 10, 'center');
      addText(new Date(orderDate).toLocaleString(), 8, 'center');
      if (cashierName) addText(`Cashier: ${cashierName}`, 8);

      yPosition += 2;

      // Customer info
      if (customerName) {
        addText(`Customer: ${customerName}`, 8);
        if (customerEmail) addText(`Email: ${customerEmail}`, 8);
        if (customerPhone) addText(`Phone: ${customerPhone}`, 8);
        yPosition += 2;
      }

      addText('================================', 8, 'center');
      yPosition += 2;

      // Items
      items.forEach(item => {
        addText(`${item.name}`, 9);
        addText(`${item.sku}`, 8);
        addText(`${item.quantity} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.total_price)}`, 8);
        yPosition += 1;
      });

      yPosition += 2;
      addText('================================', 8, 'center');
      yPosition += 2;

      // Totals
      addText(`Subtotal: ${formatCurrency(subtotal)}`, 9);
      if (discountAmount > 0) {
        addText(`Discount${discountCode ? ` (${discountCode})` : ''}: -${formatCurrency(discountAmount)}`, 9);
      }
      if (taxAmount > 0) {
        addText(`Tax (${(taxRate * 100).toFixed(1)}%): ${formatCurrency(taxAmount)}`, 9);
      }
      addText(`TOTAL: $${total.toFixed(2)}`, 11);
      addText(`Payment: ${paymentMethod}`, 9);

      yPosition += 4;
      addText('================================', 8, 'center');
      yPosition += 2;
      addText('Thank you for your business!', 9, 'center');
      addText('Please keep this receipt', 8, 'center');
      addText('for your records.', 8, 'center');

      // Save the PDF
      doc.save(`receipt-${orderNumber}.pdf`);
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
