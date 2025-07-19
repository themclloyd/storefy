import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  CreditCard,
  DollarSign,
  User,
  Receipt,
  CheckCircle
} from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTax } from "@/hooks/useTax";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

const paymentSchema = z.object({
  payment_amount: z.number().min(0.01, "Payment amount must be greater than 0"),
  payment_method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

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
}

interface LaybyPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laybyOrder: LaybyOrder | null;
  onPaymentProcessed: () => void;
}

export function LaybyPaymentDialog({
  open,
  onOpenChange,
  laybyOrder,
  onPaymentProcessed
}: LaybyPaymentDialogProps) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { formatCurrency } = useTax();
  const { getPaymentOptions, isValidPaymentMethod, formatPaymentMethodDisplay } = usePaymentMethods();
  const [loading, setLoading] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_amount: 0,
      payment_method: "",
      notes: "",
    },
  });

  const watchedAmount = form.watch("payment_amount");
  const isFullPayment = laybyOrder && watchedAmount >= laybyOrder.balance_remaining;

  const onSubmit = async (data: PaymentFormData) => {
    if (!currentStore || !user || !laybyOrder) {
      toast.error("Missing required information");
      return;
    }

    if (!data.payment_method) {
      toast.error("Please select a payment method");
      return;
    }

    if (data.payment_amount > laybyOrder.balance_remaining) {
      toast.error("Payment amount cannot exceed the balance remaining");
      return;
    }

    try {
      setLoading(true);

      // Process the payment using the database function
      const { error: paymentError } = await supabase
        .rpc('process_layby_payment', {
          _layby_order_id: laybyOrder.id,
          _payment_amount: data.payment_amount,
          _payment_method: data.payment_method,
          _payment_reference: `Payment for ${laybyOrder.layby_number}`,
          _notes: data.notes || null,
          _processed_by: user.id,
        });

      if (paymentError) {
        console.error('Error processing payment:', paymentError);
        toast.error('Failed to process payment');
        return;
      }

      const newBalance = laybyOrder.balance_remaining - data.payment_amount;
      const isCompleted = newBalance <= 0;

      toast.success(
        isCompleted
          ? `Payment processed! Layby order ${laybyOrder.layby_number} is complete.`
          : `Payment of ${formatCurrency(data.payment_amount)} processed. Balance: ${formatCurrency(newBalance)}`
      );

      onPaymentProcessed();
      onOpenChange(false);
      form.reset();
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  if (!laybyOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Process Payment
          </DialogTitle>
          <DialogDescription className="text-sm">
            {laybyOrder.customer_name} • {laybyOrder.layby_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Balance Summary */}
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Balance Due</div>
              <div className="text-xl font-bold text-warning">
                {formatCurrency(laybyOrder.balance_remaining)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="font-semibold">{formatCurrency(laybyOrder.total_amount)}</div>
            </div>
          </div>

          {/* Payment Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Payment Amount */}
              <FormField
                control={form.control}
                name="payment_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={laybyOrder.balance_remaining}
                          placeholder="Enter payment amount"
                          className="h-10 pr-16"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-xs font-medium"
                          onClick={() => field.onChange(laybyOrder.balance_remaining)}
                        >
                          Full
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select payment method">
                            {field.value && (() => {
                              const option = getPaymentOptions().find(opt => opt.id === field.value);
                              return option ? (
                                <div className="flex items-center gap-2">
                                  {option.type === 'cash' ? (
                                    <DollarSign className="w-4 h-4" />
                                  ) : (
                                    <CreditCard className="w-4 h-4" />
                                  )}
                                  <div className="flex flex-col items-start">
                                    <span>{option.name}</span>
                                    {option.provider && (
                                      <span className="text-xs text-muted-foreground">{option.provider}</span>
                                    )}
                                  </div>
                                </div>
                              ) : null;
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getPaymentOptions().map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div className="flex items-center gap-2">
                              {option.type === 'cash' ? (
                                <DollarSign className="w-4 h-4" />
                              ) : (
                                <CreditCard className="w-4 h-4" />
                              )}
                              <div className="flex flex-col items-start">
                                <span>{option.name}</span>
                                {option.provider && (
                                  <span className="text-xs text-muted-foreground">{option.provider}</span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Add a note for this payment..."
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Summary */}
              {watchedAmount > 0 && (
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">New Balance:</span>
                    <span className={`font-bold ${isFullPayment ? 'text-success' : 'text-warning'}`}>
                      {formatCurrency(Math.max(0, laybyOrder.balance_remaining - watchedAmount))}
                    </span>
                  </div>
                  {isFullPayment && (
                    <div className="mt-2 text-center">
                      <span className="text-sm text-success font-medium">
                        ✓ This will complete the layby order
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || watchedAmount <= 0 || watchedAmount > laybyOrder.balance_remaining || !form.watch("payment_method")}
                  className="flex-1"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Process Payment
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
