import { useState, useEffect } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Palette } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be 50 characters or less"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color"),
  is_active: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
}

interface EditExpenseCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ExpenseCategory | null;
  onCategoryUpdated: () => void;
}

// Predefined color options
const colorOptions = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#6B7280', // Gray
  '#DC2626', // Red-600
];

export function EditExpenseCategoryDialog({ 
  open, 
  onOpenChange, 
  category,
  onCategoryUpdated 
}: EditExpenseCategoryDialogProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3B82F6",
      is_active: true,
    },
  });

  const selectedColor = form.watch("color");

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name || "",
        description: category.description || "",
        color: category.color || "#3B82F6",
        is_active: category.is_active ?? true,
      });
    }
  }, [category, form]);

  const onSubmit = async (data: CategoryFormData) => {
    if (!currentStore || !user || !category) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({
          name: data.name,
          description: data.description || null,
          color: data.color,
          is_active: data.is_active,
        })
        .eq('id', category.id);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('A category with this name already exists');
        }
        throw error;
      }

      toast.success('Category updated successfully');
      onCategoryUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast.error(error.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the expense category details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Office Supplies" {...field} />
                  </FormControl>
                  <FormMessage />
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
                      placeholder="Brief description of this category..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Color Picker Grid */}
                      <div className="grid grid-cols-6 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              selectedColor === color 
                                ? 'border-foreground scale-110' 
                                : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                            title={color}
                          />
                        ))}
                      </div>
                      
                      {/* Custom Color Input */}
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border border-muted-foreground/20"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <Input
                          type="text"
                          placeholder="#3B82F6"
                          value={field.value}
                          onChange={field.onChange}
                          className="font-mono text-sm"
                        />
                        <Palette className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active Category</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive categories won't appear in expense forms
                    </p>
                  </div>
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
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Category
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
