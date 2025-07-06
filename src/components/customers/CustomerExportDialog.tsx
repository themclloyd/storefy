import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Loader2,
  Users,
  Calendar,
  DollarSign
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  total_orders: number | null;
  total_spent: number | null;
  status: string | null;
  created_at: string;
}

interface CustomerExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
}

interface ExportOptions {
  includeContactInfo: boolean;
  includeOrderStats: boolean;
  includeStatus: boolean;
  includeJoinDate: boolean;
  format: 'pdf' | 'csv';
}

export function CustomerExportDialog({ 
  open, 
  onOpenChange, 
  customers 
}: CustomerExportDialogProps) {
  const { currentStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeContactInfo: true,
    includeOrderStats: true,
    includeStatus: true,
    includeJoinDate: true,
    format: 'pdf'
  });

  const handleExport = async () => {
    if (!currentStore || customers.length === 0) {
      toast.error("No customers to export");
      return;
    }

    setLoading(true);
    try {
      if (exportOptions.format === 'pdf') {
        await exportToPDF();
      } else {
        await exportToCSV();
      }
      
      toast.success(`Customer data exported successfully as ${exportOptions.format.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export customer data');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(`${currentStore?.name} - Customer Directory`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Customers: ${customers.length}`, 20, 40);

    // Summary Statistics
    const totalRevenue = customers.reduce((sum, customer) => sum + (customer.total_spent || 0), 0);
    const totalOrders = customers.reduce((sum, customer) => sum + (customer.total_orders || 0), 0);
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const vipCustomers = customers.filter(c => c.status === 'vip').length;

    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 20, 50);
    doc.text(`Total Orders: ${totalOrders}`, 20, 60);
    doc.text(`Active Customers: ${activeCustomers}`, 120, 50);
    doc.text(`VIP Customers: ${vipCustomers}`, 120, 60);

    // Prepare table data
    const headers = ['Name'];
    if (exportOptions.includeContactInfo) {
      headers.push('Email', 'Phone');
    }
    if (exportOptions.includeOrderStats) {
      headers.push('Orders', 'Total Spent');
    }
    if (exportOptions.includeStatus) {
      headers.push('Status');
    }
    if (exportOptions.includeJoinDate) {
      headers.push('Join Date');
    }

    const tableData = customers.map(customer => {
      const row = [customer.name];
      
      if (exportOptions.includeContactInfo) {
        row.push(customer.email || '-', customer.phone || '-');
      }
      if (exportOptions.includeOrderStats) {
        row.push(
          (customer.total_orders || 0).toString(),
          `$${(customer.total_spent || 0).toFixed(2)}`
        );
      }
      if (exportOptions.includeStatus) {
        row.push((customer.status || 'active').toUpperCase());
      }
      if (exportOptions.includeJoinDate) {
        row.push(new Date(customer.created_at).toLocaleDateString());
      }
      
      return row;
    });

    // Add table
    (doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 80,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Save the PDF
    doc.save(`${currentStore.name}-customers-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = async () => {
    const headers = ['Name'];
    if (exportOptions.includeContactInfo) {
      headers.push('Email', 'Phone', 'Address');
    }
    if (exportOptions.includeOrderStats) {
      headers.push('Total Orders', 'Total Spent');
    }
    if (exportOptions.includeStatus) {
      headers.push('Status');
    }
    if (exportOptions.includeJoinDate) {
      headers.push('Join Date');
    }

    const csvData = [
      headers,
      ...customers.map(customer => {
        const row = [customer.name];
        
        if (exportOptions.includeContactInfo) {
          row.push(
            customer.email || '',
            customer.phone || '',
            customer.address || ''
          );
        }
        if (exportOptions.includeOrderStats) {
          row.push(
            (customer.total_orders || 0).toString(),
            (customer.total_spent || 0).toFixed(2)
          );
        }
        if (exportOptions.includeStatus) {
          row.push(customer.status || 'active');
        }
        if (exportOptions.includeJoinDate) {
          row.push(new Date(customer.created_at).toLocaleDateString());
        }
        
        return row;
      })
    ];

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentStore?.name}-customers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Customer Data
          </DialogTitle>
          <DialogDescription>
            Choose the format and data to include in your customer export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pdf"
                  checked={exportOptions.format === 'pdf'}
                  onCheckedChange={() => setExportOptions(prev => ({ ...prev, format: 'pdf' }))}
                />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-red-500" />
                  PDF Report
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="csv"
                  checked={exportOptions.format === 'csv'}
                  onCheckedChange={() => setExportOptions(prev => ({ ...prev, format: 'csv' }))}
                />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-green-500" />
                  CSV File
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Data Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include Data</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contact"
                  checked={exportOptions.includeContactInfo}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeContactInfo: !!checked }))
                  }
                />
                <Label htmlFor="contact" className="cursor-pointer">
                  Contact Information (Email, Phone, Address)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="orders"
                  checked={exportOptions.includeOrderStats}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeOrderStats: !!checked }))
                  }
                />
                <Label htmlFor="orders" className="cursor-pointer">
                  Order Statistics (Total Orders, Total Spent)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status"
                  checked={exportOptions.includeStatus}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeStatus: !!checked }))
                  }
                />
                <Label htmlFor="status" className="cursor-pointer">
                  Customer Status
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="joinDate"
                  checked={exportOptions.includeJoinDate}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeJoinDate: !!checked }))
                  }
                />
                <Label htmlFor="joinDate" className="cursor-pointer">
                  Join Date
                </Label>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Export Summary</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Total customers: {customers.length}</div>
              <div>Format: {exportOptions.format.toUpperCase()}</div>
              <div>
                Includes: {[
                  exportOptions.includeContactInfo && 'Contact Info',
                  exportOptions.includeOrderStats && 'Order Stats',
                  exportOptions.includeStatus && 'Status',
                  exportOptions.includeJoinDate && 'Join Date'
                ].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading || customers.length === 0}
            className="bg-gradient-primary text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {exportOptions.format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
