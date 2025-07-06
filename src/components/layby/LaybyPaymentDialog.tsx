import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign } from "lucide-react";

interface LaybyOrder {
  id: string;
  layby_number: string;
  customer_name: string;
  customer_id?: string;
  total_amount: number;
  balance_remaining: number;
}

interface LaybyPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layby: LaybyOrder;
  onSuccess: () => void;
}

export function LaybyPaymentDialog({ open, onOpenChange, layby, onSuccess }: LaybyPaymentDialogProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");

  const paymentAmountNum = parseFloat(paymentAmount) || 0;
  const newBalance = layby.balance_remaining - paymentAmountNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentStore || !user) {
      toast.error('Store or user not found');
      return;
    }

    if (paymentAmountNum <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (paymentAmountNum > layby.balance_remaining) {
      toast.error('Payment amount cannot exceed balance remaining');
      return;
    }

    setLoading(true);

    try {
      // Create payment record
      const { error: paymentError } = await supabase
        .from('layby_payments')
        .insert({
          layby_order_id: layby.id,
          amount: paymentAmountNum,
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim() || null,
          notes: notes.trim() || null,
          processed_by: user.id
        });

      if (paymentError) {
        throw paymentError;
      }

      // Update layby order balance
      const { error: updateError } = await supabase
        .from('layby_orders')
        .update({
          balance_remaining: newBalance
        })
        .eq('id', layby.id);

      if (updateError) {
        throw updateError;
      }

      // Create transaction record
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
          amount: paymentAmountNum,
          payment_method: paymentMethod,
          reference_id: layby.id,
          reference_type: 'layby_order',
          customer_id: layby.customer_id || null,
          customer_name: layby.customer_name,
          description: `Payment for layby ${layby.layby_number}`,
          notes: notes.trim() || null,
          processed_by: user.id
        });

      if (transactionError) {
        throw transactionError;
      }

      toast.success('Payment processed successfully');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentReference("");
    setNotes("");
  };

  const handleQuickAmount = (amount: number) => {
    setPaymentAmount(amount.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Process Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Layby Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layby Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Layby Number:</span>
                <span className="font-semibold">{layby.layby_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-semibold">{layby.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">${layby.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance Remaining:</span>
                <span className="font-semibold text-primary">${layby.balance_remaining.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Amount */}
            <div>
              <Label htmlFor="payment-amount">Payment Amount *</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={layby.balance_remaining}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                required
              />
              
              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(layby.balance_remaining / 2)}
                >
                  Half
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(layby.balance_remaining)}
                >
                  Full Balance
                </Button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Reference */}
            <div>
              <Label htmlFor="payment-reference">Payment Reference</Label>
              <Input
                id="payment-reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Enter reference number (optional)"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>

            {/* Payment Summary */}
            {paymentAmountNum > 0 && (
              <Card className="bg-muted">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Payment Amount:</span>
                    <span className="font-semibold">${paymentAmountNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Balance:</span>
                    <span className={`font-semibold ${newBalance === 0 ? 'text-green-600' : 'text-primary'}`}>
                      ${newBalance.toFixed(2)}
                    </span>
                  </div>
                  {newBalance === 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ This payment will complete the layby
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || paymentAmountNum <= 0}>
                {loading ? "Processing..." : "Process Payment"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
