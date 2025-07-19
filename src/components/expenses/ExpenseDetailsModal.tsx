import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Receipt, 
  Calendar, 
  DollarSign, 
  User, 
  Building, 
  Phone, 
  FileText, 
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Tag,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { useCurrentStore } from "@/stores/storeStore";
import { supabase } from "@/integrations/supabase/client";
import { useTax } from "@/hooks/useTax";
import { toast } from "sonner";

interface Expense {
  id: string;
  expense_number: string;
  title: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  vendor_name: string;
  vendor_contact: string;
  receipt_number: string;
  tax_amount: number;
  is_tax_deductible: boolean;
  status: 'pending' | 'paid';
  notes: string;
  created_at: string;
  expense_categories?: { name: string; color: string };
  created_by_profile?: { display_name: string };
}

interface ExpenseAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface ExpenseDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

export function ExpenseDetailsModal({ 
  open, 
  onOpenChange, 
  expense 
}: ExpenseDetailsModalProps) {
  const { formatCurrency } = useTax();
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    if (expense && open) {
      fetchAttachments();
    }
  }, [expense, open]);

  const fetchAttachments = async () => {
    if (!expense) return;

    setLoadingAttachments(true);
    try {
      const { data, error } = await supabase
        .from('expense_attachments')
        .select('*')
        .eq('expense_id', expense.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      paid: { label: 'Paid', variant: 'default' as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      cash: 'Cash',
      card: 'Card',
      bank_transfer: 'Bank Transfer',
      check: 'Check',
      other: 'Other'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const downloadAttachment = (attachment: ExpenseAttachment) => {
    window.open(attachment.file_url, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Expense Details
          </DialogTitle>
          <DialogDescription>
            Complete information for expense {expense.expense_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{expense.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {expense.expense_number}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(expense.amount)}</div>
                  {getStatusBadge(expense.status)}
                </div>
              </div>
            </CardHeader>
            {expense.description && (
              <CardContent>
                <p className="text-muted-foreground">{expense.description}</p>
              </CardContent>
            )}
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">{format(new Date(expense.expense_date), "PPP")}</span>
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Payment Method:</span>
                  <span className="text-sm">{getPaymentMethodLabel(expense.payment_method)}</span>
                </div>

                {expense.expense_categories && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Category:</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: expense.expense_categories.color }}
                      />
                      <span className="text-sm">{expense.expense_categories.name}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created by:</span>
                  <span className="text-sm">{expense.created_by_profile?.display_name || 'Unknown'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{format(new Date(expense.created_at), "PPP 'at' p")}</span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-sm font-bold">{formatCurrency(expense.amount)}</span>
                </div>

                {expense.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Tax Amount:</span>
                    <span className="text-sm">{formatCurrency(expense.tax_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Tax Deductible:</span>
                  <Badge variant={expense.is_tax_deductible ? "default" : "secondary"}>
                    {expense.is_tax_deductible ? "Yes" : "No"}
                  </Badge>
                </div>

                {expense.receipt_number && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Receipt #:</span>
                    <span className="text-sm font-mono">{expense.receipt_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Vendor Information */}
          {(expense.vendor_name || expense.vendor_contact) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Vendor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expense.vendor_name && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm">{expense.vendor_name}</span>
                  </div>
                )}

                {expense.vendor_contact && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Contact:</span>
                    <span className="text-sm">{expense.vendor_contact}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {expense.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {expense.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Attachments ({attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAttachments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No attachments found
                </p>
              ) : (
                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.file_size)} • {format(new Date(attachment.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadAttachment(attachment)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
