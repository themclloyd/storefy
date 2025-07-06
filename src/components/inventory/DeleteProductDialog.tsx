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

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onProductDeleted: () => void;
}

export function DeleteProductDialog({ 
  open, 
  onOpenChange, 
  product, 
  onProductDeleted 
}: DeleteProductDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!product) return;

    setLoading(true);
    try {
      // Instead of hard deleting, we'll soft delete by setting is_active to false
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', product.id);

      if (error) throw error;

      toast.success('Product deleted successfully!');
      onProductDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{product.name}"? This action will deactivate the product
            and it will no longer appear in your inventory. This action can be reversed by editing
            the product and reactivating it.
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
            Delete Product
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
