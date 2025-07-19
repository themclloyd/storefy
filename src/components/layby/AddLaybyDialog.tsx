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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTax } from "@/hooks/useTax";

const laybySchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_phone: z.string().optional(),
  total_amount: z.number().min(0.01, "Total amount must be greater than 0"),
  deposit_amount: z.number().min(0.01, "Deposit amount must be greater than 0"),
  notes: z.string().optional(),
});

type LaybyFormData = z.infer<typeof laybySchema>;

interface AddLaybyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLaybyAdded: () => void;
}

export function AddLaybyDialog({ open, onOpenChange, onLaybyAdded }: AddLaybyDialogProps) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { formatCurrency } = useTax();
  const [loading, setLoading] = useState(false);

  const form = useForm<LaybyFormData>({
    resolver: zodResolver(laybySchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      total_amount: 0,
      deposit_amount: 0,
      notes: "",
    },
  });

  const totalAmount = form.watch("total_amount") || 0;
  const depositAmount = form.watch("deposit_amount") || 0;
  const balanceRemaining = totalAmount - depositAmount;

  const onSubmit = async (data: LaybyFormData) => {
    if (!currentStore || !user) {
      toast.error("Store or user information not available");
      return;
    }

    if (data.deposit_amount >= data.total_amount) {
      toast.error("Deposit amount must be less than the total amount");
      return;
    }

    try {
      setLoading(true);

      // Generate layby number
      const { data: laybyNumberData, error: laybyNumberError } = await supabase
        .rpc('generate_layby_number', { store_id: currentStore.id });

      if (laybyNumberError) {
        throw laybyNumberError;
      }

      // Create layby order
      const { error: laybyError } = await supabase
        .from('layby_orders')
        .insert({
          store_id: currentStore.id,
          layby_number: laybyNumberData,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone || null,
          total_amount: data.total_amount,
          deposit_amount: data.deposit_amount,
          balance_remaining: data.total_amount - data.deposit_amount,
          status: 'active',
          notes: data.notes || null,
          created_by: user.id,
        });

      if (laybyError) {
        throw laybyError;
      }

      toast.success(`Layby order ${laybyNumberData} created successfully`);
      onLaybyAdded();
      onOpenChange(false);
      form.reset();

    } catch (error) {
      console.error('Error creating layby order:', error);
      toast.error('Failed to create layby order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-[#2CA01C]/10 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#2CA01C]" />
            </div>
            Create New Layby
          </DialogTitle>
          <DialogDescription>
            Create a new layby order for a customer with deposit and payment terms.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Customer Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter customer name"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter phone number"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Financial Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="total_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          className="h-11"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deposit_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={totalAmount}
                          placeholder="0.00"
                          className="h-11"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Balance Summary */}
              {totalAmount > 0 && depositAmount > 0 && (
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Deposit:</span>
                    <span className="font-medium text-[#2CA01C]">{formatCurrency(depositAmount)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Balance Remaining:</span>
                      <span className="text-lg font-bold text-orange-500">
                        {formatCurrency(balanceRemaining)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes or terms..."
                        rows={3}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
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
                disabled={loading || !totalAmount || !depositAmount}
                className="flex-1 bg-[#2CA01C] hover:bg-[#2CA01C]/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Layby Order
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
