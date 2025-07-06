import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Download, FileText, Table } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  categories?: { name: string };
  suppliers?: { name: string };
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

interface ExportField {
  key: keyof Product | 'category' | 'supplier';
  label: string;
  enabled: boolean;
}

const defaultFields: ExportField[] = [
  { key: 'name', label: 'Product Name', enabled: true },
  { key: 'sku', label: 'SKU', enabled: true },
  { key: 'description', label: 'Description', enabled: false },
  { key: 'category', label: 'Category', enabled: true },
  { key: 'supplier', label: 'Supplier', enabled: true },
  { key: 'price', label: 'Price', enabled: true },
  { key: 'cost', label: 'Cost', enabled: true },
  { key: 'stock_quantity', label: 'Stock Quantity', enabled: true },
  { key: 'low_stock_threshold', label: 'Low Stock Threshold', enabled: false },
  { key: 'is_active', label: 'Active Status', enabled: false },
  { key: 'created_at', label: 'Date Added', enabled: false },
];

export function ExportDialog({ open, onOpenChange, products }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [fields, setFields] = useState<ExportField[]>(defaultFields);
  const [loading, setLoading] = useState(false);

  const toggleField = (index: number) => {
    const newFields = [...fields];
    newFields[index].enabled = !newFields[index].enabled;
    setFields(newFields);
  };

  const selectAll = () => {
    setFields(fields.map(field => ({ ...field, enabled: true })));
  };

  const selectNone = () => {
    setFields(fields.map(field => ({ ...field, enabled: false })));
  };

  const getFieldValue = (product: Product, field: ExportField) => {
    switch (field.key) {
      case 'category':
        return product.categories?.name || 'Uncategorized';
      case 'supplier':
        return product.suppliers?.name || 'No Supplier';
      case 'is_active':
        return product.is_active ? 'Active' : 'Inactive';
      case 'created_at':
        return new Date(product.created_at).toLocaleDateString();
      case 'price':
      case 'cost':
        return product[field.key]?.toFixed(2) || '0.00';
      default:
        return product[field.key as keyof Product] || '';
    }
  };

  const exportToCSV = () => {
    const enabledFields = fields.filter(field => field.enabled);
    
    if (enabledFields.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    // Create CSV header
    const headers = enabledFields.map(field => field.label);
    const csvContent = [headers.join(',')];

    // Add data rows
    products.forEach(product => {
      const row = enabledFields.map(field => {
        const value = getFieldValue(product, field);
        // Escape commas and quotes in CSV
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent.push(row.join(','));
    });

    return csvContent.join('\n');
  };

  const exportToJSON = () => {
    const enabledFields = fields.filter(field => field.enabled);

    if (enabledFields.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    const exportData = products.map(product => {
      const exportProduct: any = {};
      enabledFields.forEach(field => {
        exportProduct[field.label] = getFieldValue(product, field);
      });
      return exportProduct;
    });

    return JSON.stringify(exportData, null, 2);
  };

  const exportToPDF = () => {
    const enabledFields = fields.filter(field => field.enabled);

    if (enabledFields.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    // Create a simple HTML table for PDF generation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .header { text-align: center; margin-bottom: 20px; }
          .date { color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Inventory Report</h1>
          <p class="date">Generated on ${new Date().toLocaleDateString()}</p>
          <p>Total Products: ${products.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${enabledFields.map(field => `<th>${field.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${products.map(product => `
              <tr>
                ${enabledFields.map(field => `<td>${getFieldValue(product, field)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    return htmlContent;
  };

  const handleExport = async () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }

    setLoading(true);
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        content = exportToCSV();
        filename = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else if (format === 'json') {
        content = exportToJSON();
        filename = `inventory-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        content = exportToPDF();
        filename = `inventory-export-${new Date().toISOString().split('T')[0]}.html`;
        mimeType = 'text/html';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${products.length} products successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const enabledFieldsCount = fields.filter(field => field.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Inventory</DialogTitle>
          <DialogDescription>
            Export {products.length} products to a file. Choose format and fields to include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value: 'csv' | 'json' | 'pdf') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    CSV (Comma Separated Values)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    JSON (JavaScript Object Notation)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF (Printable Report)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fields to Export ({enabledFieldsCount} selected)</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={selectNone}>
                  Select None
                </Button>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
              {fields.map((field, index) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`field-${field.key}`}
                    checked={field.enabled}
                    onCheckedChange={() => toggleField(index)}
                  />
                  <Label
                    htmlFor={`field-${field.key}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="text-sm text-muted-foreground">
            <p>
              {enabledFieldsCount > 0 
                ? `Ready to export ${products.length} products with ${enabledFieldsCount} fields`
                : 'Please select at least one field to export'
              }
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading || enabledFieldsCount === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            Export {format === 'pdf' ? 'PDF' : format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
