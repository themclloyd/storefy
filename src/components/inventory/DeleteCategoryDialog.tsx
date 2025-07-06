import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onCategoryDeleted: () => void;
}

export function DeleteCategoryDialog({ 
  open, 
  onOpenChange, 
  category, 
  onCategoryDeleted 
}: DeleteCategoryDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!category) return;

    setLoading(true);
    try {
      // Check if category is used by any products
      const { data: products, error: checkError } = await supabase
        .from('products')
        .select('id, name')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .limit(5);

      if (checkError) throw checkError;

      if (products && products.length > 0) {
        toast.error(
          `Cannot delete category. It's currently assigned to ${products.length} product${products.length > 1 ? 's' : ''}. Please reassign or remove these products first.`
        );
        setLoading(false);
        return;
      }

      // Hard delete the category since it's not used
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast.success('Category deleted successfully!');
      onCategoryDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the category "{category.name}"? This action cannot be undone.
            Products currently assigned to this category will be moved to "Uncategorized".
            {category.description && (
              <>
                <br /><br />
                <strong>Description:</strong> {category.description}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Category
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
