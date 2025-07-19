import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Clock,
  User,
  DollarSign,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  Calendar,
  History
} from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTax } from "@/hooks/useTax";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { format } from "date-fns";

interface LaybyOrder {
  id: string;
  layby_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  total_amount: number;
  deposit_amount: number;
  balance_remaining: number;
  status: string;
  due_date: string | null;
  created_at: string;
  completion_date: string | null;
  notes: string | null;
}

interface LaybyPayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  processed_by: string;
}

interface LaybyDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laybyOrder: LaybyOrder | null;
  onLaybyUpdated?: () => void;
  onPaymentRequested?: (laybyOrder: LaybyOrder) => void;
}

export function LaybyDetailsModal({
  open,
  onOpenChange,
  laybyOrder,
  onPaymentRequested
}: LaybyDetailsModalProps) {
  const { formatCurrency } = useTax();
  const { getPaymentMethodDisplay } = usePaymentMethods();
  const [loading] = useState(false);
  const [payments, setPayments] = useState<LaybyPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    if (!laybyOrder) return;

    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('layby_payments')
        .select('*')
        .eq('layby_order_id', laybyOrder.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        return;
      }

      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Fetch payment history when modal opens
  useEffect(() => {
    if (open && laybyOrder) {
      fetchPaymentHistory();
    }
  }, [open, laybyOrder]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary text-primary-foreground"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
      case 'completed':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'overdue':
        return <Badge className="bg-warning text-warning-foreground"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handlePaymentRequest = () => {
    if (laybyOrder && onPaymentRequested) {
      onPaymentRequested(laybyOrder);
    }
  };

  if (!laybyOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">
              {laybyOrder.layby_number}
            </DialogTitle>
            {getStatusBadge(laybyOrder.status)}
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {laybyOrder.customer_name} • View details and manage payments
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <User className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{laybyOrder.customer_name}</p>
                {laybyOrder.customer_phone && (
                  <p className="text-sm text-muted-foreground">{laybyOrder.customer_phone}</p>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="text-sm font-bold text-foreground">{formatCurrency(laybyOrder.total_amount)}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="text-sm font-bold text-success">
                  {formatCurrency(laybyOrder.total_amount - laybyOrder.balance_remaining)}
                </div>
                <div className="text-xs text-muted-foreground">Paid</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className={`text-sm font-bold ${
                  laybyOrder.balance_remaining > 0 ? 'text-warning' : 'text-success'
                }`}>
                  {formatCurrency(laybyOrder.balance_remaining)}
                </div>
                <div className="text-xs text-muted-foreground">Balance</div>
              </div>
            </div>

            {/* Payment Progress & Due Date */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(((laybyOrder.total_amount - laybyOrder.balance_remaining) / laybyOrder.total_amount) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(((laybyOrder.total_amount - laybyOrder.balance_remaining) / laybyOrder.total_amount) * 100)}%`
                  }}
                />
              </div>
              {laybyOrder.due_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Due: {format(new Date(laybyOrder.due_date), 'MMM dd, yyyy')}</span>
                </div>
              )}
            </div>

            {/* Items */}
            {laybyOrder.layby_items && laybyOrder.layby_items.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Items ({laybyOrder.layby_items.length})</span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {laybyOrder.layby_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {item.products?.name || 'Unknown Item'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                        </div>
                      </div>
                      <div className="font-semibold text-foreground">
                        {formatCurrency(item.total_price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment History */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Payment History ({payments.length})</span>
              </div>
              {loadingPayments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No payments recorded yet
                </div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-foreground">
                            {formatCurrency(payment.amount)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getPaymentMethodDisplay(payment.payment_method)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {laybyOrder.notes && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium mb-1">Notes</div>
                <p className="text-sm text-muted-foreground">{laybyOrder.notes}</p>
              </div>
            )}

            {/* Actions */}
            {(laybyOrder.status === 'active' || laybyOrder.status === 'overdue') && laybyOrder.balance_remaining > 0 ? (
              <div className="flex justify-center pt-3 border-t">
                <Button
                  onClick={handlePaymentRequest}
                  className="px-6"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            ) : laybyOrder.balance_remaining === 0 ? (
              <div className="text-center py-4 border-t">
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
                <p className="text-success font-medium">Layby Completed!</p>
                <p className="text-xs text-muted-foreground mt-1">All payments received</p>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
