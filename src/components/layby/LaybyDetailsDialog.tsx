import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, User, Phone, Mail, Calendar, DollarSign, Package, CreditCard, CheckCircle, XCircle } from "lucide-react";

interface LaybyOrder {
  id: string;
  layby_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  deposit_amount: number;
  balance_remaining: number;
  status: 'active' | 'completed' | 'cancelled' | 'overdue';
  due_date: string;
  completion_date: string;
  notes: string;
  created_at: string;
  layby_items?: LaybyItem[];
  layby_payments?: LaybyPayment[];
}

interface LaybyItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    sku: string;
  };
}

interface LaybyPayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  notes: string;
  created_at: string;
}

interface LaybyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layby: LaybyOrder;
  onUpdate: () => void;
}

export function LaybyDetailsDialog({ open, onOpenChange, layby, onUpdate }: LaybyDetailsDialogProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", variant: "default" as const, icon: Clock },
      completed: { label: "Completed", variant: "secondary" as const, icon: CheckCircle },
      cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle },
      overdue: { label: "Overdue", variant: "destructive" as const, icon: Clock },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleCompleteLayby = async () => {
    if (!currentStore || !user) {
      toast.error('Store or user not found');
      return;
    }

    setLoading(true);

    try {
      // Update layby order status
      const { error: updateError } = await supabase
        .from('layby_orders')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString(),
          balance_remaining: 0
        })
        .eq('id', layby.id);

      if (updateError) {
        throw updateError;
      }

      // Create final payment record if there's remaining balance
      if (layby.balance_remaining > 0) {
        const { error: paymentError } = await supabase
          .from('layby_payments')
          .insert({
            layby_order_id: layby.id,
            amount: layby.balance_remaining,
            payment_method: 'cash',
            notes: 'Final payment - layby completion',
            processed_by: user.id
          });

        if (paymentError) {
          throw paymentError;
        }

        // Create transaction record for final payment
        const { data: transactionNumber, error: transactionNumberError } = await supabase
          .rpc('generate_transaction_number', { store_id_param: currentStore.id });

        if (transactionNumberError) {
          throw transactionNumberError;
        }

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            store_id: currentStore.id,
            transaction_number: transactionNumber,
            transaction_type: 'layby_payment',
            amount: layby.balance_remaining,
            payment_method: 'cash',
            reference_id: layby.id,
            reference_type: 'layby_order',
            customer_id: layby.customer_id || null,
            customer_name: layby.customer_name,
            description: `Final payment for layby ${layby.layby_number}`,
            processed_by: user.id
          });

        if (transactionError) {
          throw transactionError;
        }
      }

      toast.success('Layby order completed successfully');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing layby order:', error);
      toast.error('Failed to complete layby order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLayby = async () => {
    if (!currentStore || !user) {
      toast.error('Store or user not found');
      return;
    }

    setLoading(true);

    try {
      // Update layby order status
      const { error: updateError } = await supabase
        .from('layby_orders')
        .update({
          status: 'cancelled'
        })
        .eq('id', layby.id);

      if (updateError) {
        throw updateError;
      }

      toast.success('Layby order cancelled successfully');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error cancelling layby order:', error);
      toast.error('Failed to cancel layby order');
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = (layby.layby_payments || []).reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Layby Details</DialogTitle>
            {getStatusBadge(layby.status)}
          </div>
          <DialogDescription>
            View and manage layby order details, payments, and status updates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Layby Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Layby Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Layby Number</div>
                  <div className="font-semibold text-lg">{layby.layby_number}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created Date</div>
                  <div className="font-medium">{new Date(layby.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Due Date</div>
                  <div className="font-medium">
                    {layby.due_date ? new Date(layby.due_date).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
                {layby.completion_date && (
                  <div>
                    <div className="text-sm text-muted-foreground">Completion Date</div>
                    <div className="font-medium">{new Date(layby.completion_date).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
              {layby.notes && (
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="font-medium">{layby.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-semibold text-lg">{layby.customer_name}</div>
                </div>
                {layby.customer_phone && (
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Phone
                    </div>
                    <div className="font-medium">{layby.customer_phone}</div>
                  </div>
                )}
                {layby.customer_email && (
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </div>
                    <div className="font-medium">{layby.customer_email}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="text-2xl font-bold">${layby.total_amount.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Paid</div>
                    <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Balance Remaining</div>
                    <div className="text-2xl font-bold text-orange-600">${layby.balance_remaining.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(layby.layby_items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.products.name}</TableCell>
                      <TableCell>{item.products.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                      <TableCell>${item.total_price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payment History */}
          {(layby.layby_payments || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(layby.layby_payments || []).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>${payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{payment.payment_method.replace('_', ' ')}</TableCell>
                        <TableCell>{payment.payment_reference || '-'}</TableCell>
                        <TableCell>{payment.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {layby.status === 'active' && (
            <div className="flex justify-end gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={loading}>
                    Cancel Layby
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Layby Order</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this layby order? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelLayby} disabled={loading}>
                      {loading ? "Cancelling..." : "Cancel Layby"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {layby.balance_remaining <= 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={loading}>
                      Complete Layby
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Complete Layby Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to mark this layby order as completed? The customer will be able to collect their items.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCompleteLayby} disabled={loading}>
                        {loading ? "Completing..." : "Complete Layby"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
