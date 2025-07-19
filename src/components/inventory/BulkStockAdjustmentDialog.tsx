import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Minus } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const adjustmentSchema = z.object({
  adjustment_type: z.enum(['manual', 'restock', 'damage', 'return', 'transfer']),
  quantity_change: z.number().int().refine((val) => val !== 0, {
    message: "Quantity change cannot be zero",
  }),
  reason: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
}

interface BulkStockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onStockAdjusted: () => void;
}

const adjustmentTypes = [
  { value: 'manual', label: 'Manual Adjustment', description: 'General stock adjustment' },
  { value: 'restock', label: 'Restock', description: 'Adding new inventory' },
  { value: 'damage', label: 'Damage/Loss', description: 'Items damaged or lost' },
  { value: 'return', label: 'Return', description: 'Customer returns' },
  { value: 'transfer', label: 'Transfer', description: 'Transfer to/from other locations' },
];

export function BulkStockAdjustmentDialog({ 
  open, 
  onOpenChange, 
  products, 
  onStockAdjusted 
}: BulkStockAdjustmentDialogProps) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const [loading, setLoading] = useState(false);

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustment_type: 'manual',
      quantity_change: 0,
      reason: "",
    },
  });

  const watchedQuantityChange = form.watch('quantity_change');

  const handleQuickAdjustment = (amount: number) => {
    const currentValue = form.getValues('quantity_change');
    const newValue = currentValue + amount;
    form.setValue('quantity_change', newValue);
  };

  const onSubmit = async (data: AdjustmentFormData) => {
    if (!currentStore || !user || products.length === 0) return;

    setLoading(true);
    try {
      // Check if any product would have negative stock
      const invalidProducts = products.filter(
        product => product.stock_quantity + data.quantity_change < 0
      );

      if (invalidProducts.length > 0) {
        toast.error(`Some products would have negative stock: ${invalidProducts.map(p => p.name).join(', ')}`);
        setLoading(false);
        return;
      }

      // Process each product
      const updates = products.map(product => ({
        id: product.id,
        newStockQuantity: product.stock_quantity + data.quantity_change,
      }));

      // Update all products
      for (const update of updates) {
        const { error: productError } = await supabase
          .from('products')
          .update({ stock_quantity: update.newStockQuantity })
          .eq('id', update.id);

        if (productError) throw productError;

        // Create stock adjustment record
        const product = products.find(p => p.id === update.id)!;
        const { error: adjustmentError } = await supabase
          .from('stock_adjustments')
          .insert([
            {
              store_id: currentStore.id,
              product_id: product.id,
              user_id: user.id,
              adjustment_type: data.adjustment_type,
              quantity_change: data.quantity_change,
              previous_quantity: product.stock_quantity,
              new_quantity: update.newStockQuantity,
              reason: data.reason || null,
            }
          ]);

        if (adjustmentError) throw adjustmentError;
      }

      toast.success(`Stock adjusted for ${products.length} products successfully!`);
      form.reset();
      onStockAdjusted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  if (products.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Stock Adjustment</DialogTitle>
          <DialogDescription>
            Adjust stock quantity for {products.length} selected products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Products List */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Selected Products ({products.length})</h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {products.map((product) => (
                  <div key={product.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{product.name}</span>
                      {product.sku && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {product.sku}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Current: {product.stock_quantity}</span>
                      <span>→</span>
                      <span className={
                        product.stock_quantity + watchedQuantityChange < 0 
                          ? "text-destructive font-medium" 
                          : "font-medium"
                      }>
                        New: {product.stock_quantity + watchedQuantityChange}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="adjustment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select adjustment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {adjustmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quick Adjustment Buttons */}
              <div className="space-y-2">
                <FormLabel>Quick Adjustments</FormLabel>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdjustment(-10)}
                  >
                    <Minus className="w-3 h-3 mr-1" />
                    10
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdjustment(-5)}
                  >
                    <Minus className="w-3 h-3 mr-1" />
                    5
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdjustment(-1)}
                  >
                    <Minus className="w-3 h-3 mr-1" />
                    1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdjustment(1)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdjustment(5)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    5
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdjustment(10)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    10
                  </Button>
                </div>
              </div>

              <FormField
                control={form.control}
                name="quantity_change"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Change</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter quantity change"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Use positive numbers to add stock, negative to remove
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter reason for adjustment"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || products.some(p => p.stock_quantity + watchedQuantityChange < 0)}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adjust Stock for {products.length} Products
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
