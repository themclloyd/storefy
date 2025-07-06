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

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
}

interface DeleteSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSupplierDeleted: () => void;
}

export function DeleteSupplierDialog({ 
  open, 
  onOpenChange, 
  supplier, 
  onSupplierDeleted 
}: DeleteSupplierDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!supplier) return;

    setLoading(true);
    try {
      // Check if supplier is used by any products
      const { data: products, error: checkError } = await supabase
        .from('products')
        .select('id, name')
        .eq('supplier_id', supplier.id)
        .eq('is_active', true)
        .limit(5);

      if (checkError) throw checkError;

      if (products && products.length > 0) {
        toast.error(
          `Cannot delete supplier. It's currently assigned to ${products.length} product${products.length > 1 ? 's' : ''}. Please reassign or remove these products first.`
        );
        setLoading(false);
        return;
      }

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', supplier.id);

      if (error) throw error;

      toast.success('Supplier deleted successfully!');
      onSupplierDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    } finally {
      setLoading(false);
    }
  };

  if (!supplier) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{supplier.name}"? This action will deactivate the supplier
            and it will no longer appear in your supplier list. Products currently assigned to this
            supplier will need to be reassigned. This action can be reversed by editing the supplier
            and reactivating it.
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
            Delete Supplier
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
