import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Mail, Phone, MapPin, Save, Trash2 } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { SecureAction } from "@/components/auth/SecureAction";
import { useStoreData } from "@/hooks/useSupabaseClient";
import { toast } from "sonner";

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive", "vip"]).default("active"),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  total_orders: number | null;
  total_spent: number | null;
  created_at: string;
}

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onCustomerUpdated: () => void;
  onCustomerDeleted?: () => void;
}

export function EditCustomerDialog({
  open,
  onOpenChange,
  customer,
  onCustomerUpdated,
  onCustomerDeleted
}: EditCustomerDialogProps) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { from, currentStoreId, isPinSession } = useStoreData();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
      notes: "",
    },
  });

  // Update form when customer changes
  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        status: (customer.status as "active" | "inactive" | "vip") || "active",
        notes: "",
      });
    }
    // Reset delete confirmation state when customer changes
    setShowDeleteConfirm(false);
  }, [customer, form]);

  // Reset delete confirmation when dialog closes
  useEffect(() => {
    if (!open) {
      setShowDeleteConfirm(false);
    }
  }, [open]);

  const onSubmit = async (data: CustomerFormData) => {
    const storeId = currentStoreId || currentStore?.id;
    if (!storeId || (!user && !isPinSession) || !customer) {
      toast.error("Store, user, or customer information not available");
      return;
    }

    setLoading(true);
    try {
      const { error } = await from('customers')
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id)
        .eq('store_id', storeId);

      if (error) {
        console.error('Error updating customer:', error);
        toast.error('Failed to update customer');
        return;
      }

      toast.success('Customer updated successfully');
      onCustomerUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const storeId = currentStoreId || currentStore?.id;
    if (!storeId || !customer) {
      toast.error("Store or customer information not available");
      return;
    }

    setDeleteLoading(true);
    try {
      // First, check if customer has any orders
      const { data: orders, error: ordersError } = await from('orders')
        .select('id')
        .eq('customer_id', customer.id)
        .limit(1);

      if (ordersError) {
        console.error('Error checking customer orders:', ordersError);
        toast.error('Failed to check customer orders');
        return;
      }

      if (orders && orders.length > 0) {
        toast.error('Cannot delete customer with existing orders. Please contact support for assistance.');
        return;
      }

      // Delete the customer
      const { error } = await from('customers')
        .delete()
        .eq('id', customer.id)
        .eq('store_id', storeId);

      if (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
        return;
      }

      toast.success('Customer deleted successfully');
      onCustomerDeleted?.();
      onOpenChange(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Edit Customer
          </DialogTitle>
          <DialogDescription>
            Update customer information and preferences. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Name *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="customer@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter customer address"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {customer && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Customer Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Orders:</span>
                    <span className="ml-2 font-medium">{customer.total_orders || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Spent:</span>
                    <span className="ml-2 font-medium text-success">
                      ${(customer.total_spent || 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Member Since:</span>
                    <span className="ml-2 font-medium">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {/* Delete Button - Only for Managers+ */}
              <SecureAction permission="manage_customers">
                <div>
                  {!showDeleteConfirm ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={loading || deleteLoading}
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Customer
                    </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-sm text-destructive font-medium">
                        ⚠️ Are you sure you want to delete this customer?
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This action cannot be undone. The customer will be permanently removed from your database.
                        {customer && customer.total_orders && customer.total_orders > 0 && (
                          <span className="block mt-1 text-destructive">
                            Note: Customers with existing orders cannot be deleted.
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleteLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Confirm Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              </SecureAction>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading || deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || deleteLoading}
                  className="bg-gradient-primary text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Customer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
