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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be 50 characters or less"),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: () => void;
}

export function AddCategoryDialog({ open, onOpenChange, onCategoryAdded }: AddCategoryDialogProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    if (!currentStore || !user) return;

    setLoading(true);
    try {
      // Check if category name already exists for this store
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .eq('store_id', currentStore.id)
        .eq('name', data.name.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingCategory) {
        toast.error('A category with this name already exists');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('categories')
        .insert([
          {
            ...data,
            name: data.name.trim(),
            store_id: currentStore.id,
          }
        ]);

      if (error) throw error;

      toast.success('Category added successfully!');
      form.reset();
      onCategoryAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new product category to organize your inventory.
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
                    <Input 
                      placeholder="Enter category name" 
                      {...field} 
                      maxLength={50}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a clear, descriptive name for this category
                  </FormDescription>
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
                      placeholder="Enter category description (optional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help identify this category
                  </FormDescription>
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
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Category
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
