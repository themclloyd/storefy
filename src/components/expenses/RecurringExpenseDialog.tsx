import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, addMonths, addYears, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExpenseCategory } from "./types";

const recurringExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  frequency: z.enum(['monthly', 'quarterly', 'yearly']),
  start_date: z.date(),
  end_date: z.date().optional().nullable(),
  category_id: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'check', 'other']).default('bank_transfer'),
  vendor_name: z.string().optional(),
  vendor_contact: z.string().optional(),
  auto_create: z.boolean().default(true),
  notes: z.string().optional(),
});

type RecurringExpenseFormData = z.infer<typeof recurringExpenseSchema>;

interface RecurringExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseAdded: () => void;
  categories: ExpenseCategory[];
}

export function RecurringExpenseDialog({ 
  open, 
  onOpenChange, 
  onExpenseAdded, 
  categories 
}: RecurringExpenseDialogProps) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const [loading, setLoading] = useState(false);

  const form = useForm<RecurringExpenseFormData>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
      frequency: "monthly",
      start_date: new Date(),
      end_date: null,
      category_id: "none",
      payment_method: "bank_transfer",
      vendor_name: "",
      vendor_contact: "",
      auto_create: true,
      notes: "",
    },
  });

  const calculateNextDueDate = (startDate: Date, frequency: string): Date => {
    const today = new Date();
    let nextDueDate = new Date(startDate);
    
    // If start date is in the future, that's the next due date
    if (nextDueDate > today) {
      return nextDueDate;
    }
    
    // Otherwise, calculate the next occurrence based on frequency
    switch (frequency) {
      case 'monthly':
        // Find the next occurrence of the same day of month
        while (nextDueDate <= today) {
          nextDueDate = addMonths(nextDueDate, 1);
        }
        break;
      case 'quarterly':
        while (nextDueDate <= today) {
          nextDueDate = addMonths(nextDueDate, 3);
        }
        break;
      case 'yearly':
        while (nextDueDate <= today) {
          nextDueDate = addYears(nextDueDate, 1);
        }
        break;
      default:
        nextDueDate = addMonths(nextDueDate, 1);
    }
    
    return nextDueDate;
  };

  const onSubmit = async (data: RecurringExpenseFormData) => {
    if (!currentStore || !user) return;
    
    setLoading(true);
    try {
      const nextDueDate = calculateNextDueDate(data.start_date, data.frequency);
      
      // Create recurring expense
      const { data: _expenseData, error: expenseError } = await supabase
        .from('recurring_expenses')
        .insert({
          store_id: currentStore.id,
          title: data.title,
          description: data.description || null,
          amount: data.amount,
          frequency: data.frequency,
          start_date: format(data.start_date, 'yyyy-MM-dd'),
          end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : null,
          next_due_date: format(nextDueDate, 'yyyy-MM-dd'),
          category_id: data.category_id === "none" ? null : data.category_id || null,
          payment_method: data.payment_method,
          vendor_name: data.vendor_name || null,
          vendor_contact: data.vendor_contact || null,
          auto_create: data.auto_create,
          notes: data.notes || null,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (expenseError) {
        throw expenseError;
      }

      toast.success("Recurring expense added successfully");
      form.reset();
      onOpenChange(false);
      onExpenseAdded();
    } catch (error: any) {
      console.error("Error adding recurring expense:", error);
      toast.error(error.message || "Failed to add recurring expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Recurring Expense</DialogTitle>
          <DialogDescription>
            Add a recurring expense like rent, salaries, or subscriptions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Office Rent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < addDays(new Date(), -365)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>No end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Leave blank for indefinite recurring expenses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="auto_create"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Automatically create expense entries
                    </FormLabel>
                    <FormDescription>
                      When checked, expense entries will be automatically created on the due date
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this recurring expense"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Recurring Expense
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
