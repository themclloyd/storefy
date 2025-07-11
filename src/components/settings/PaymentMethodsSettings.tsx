import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Building,
  Hash,
  Eye,
  EyeOff
} from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  provider: string;
  account_number: string;
  is_active: boolean;
  created_at: string;
}

export function PaymentMethodsSettings() {
  const { currentStore, isOwner, canManage } = useStore();
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showAccountNumbers, setShowAccountNumbers] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    account_number: '',
    is_active: true
  });

  useEffect(() => {
    if (currentStore) {
      fetchPaymentMethods();
    }
  }, [currentStore]);

  const fetchPaymentMethods = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await (supabase as any)
        .from('payment_methods')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: '',
      account_number: '',
      is_active: true
    });
    setEditingMethod(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentStore || !user) return;

    // Validation
    if (!formData.name.trim() || !formData.provider.trim() || !formData.account_number.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      if (editingMethod) {
        // Update existing payment method
        const { error } = await (supabase as any)
          .from('payment_methods')
          .update({
            name: formData.name.trim(),
            provider: formData.provider.trim(),
            account_number: formData.account_number.trim(),
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMethod.id);

        if (error) throw error;
        toast.success('Payment method updated successfully');
      } else {
        // Create new payment method
        const { error } = await (supabase as any)
          .from('payment_methods')
          .insert({
            store_id: currentStore.id,
            name: formData.name.trim(),
            provider: formData.provider.trim(),
            account_number: formData.account_number.trim(),
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success('Payment method added successfully');
      }

      resetForm();
      setShowAddDialog(false);
      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Error saving payment method:', error);
      const errorMessage = error?.message || 'Failed to save payment method';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setFormData({
      name: method.name,
      provider: method.provider,
      account_number: method.account_number,
      is_active: method.is_active
    });
    setEditingMethod(method);
    setShowAddDialog(true);
  };

  const handleDelete = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const { error } = await (supabase as any)
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;
      toast.success('Payment method deleted successfully');
      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      const errorMessage = error?.message || 'Failed to delete payment method';
      toast.error(errorMessage);
    }
  };

  const toggleActive = async (methodId: string, isActive: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('payment_methods')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', methodId);

      if (error) throw error;
      toast.success(`Payment method ${isActive ? 'enabled' : 'disabled'}`);
      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      const errorMessage = error?.message || 'Failed to update payment method';
      toast.error(errorMessage);
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading payment methods...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure custom payment methods for your store. Cash is always available by default.
              </p>
            </div>
            {(isOwner || canManage) && (
              <Dialog open={showAddDialog} onOpenChange={(open) => {
                setShowAddDialog(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingMethod
                        ? 'Update the payment method details below.'
                        : 'Add a new custom payment method for your store. This will be available in POS and layby transactions.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Mac's Account"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="provider">Provider *</Label>
                      <Input
                        id="provider"
                        value={formData.provider}
                        onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                        placeholder="e.g., National Bank"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_number">Account Number *</Label>
                      <Input
                        id="account_number"
                        value={formData.account_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                        placeholder="e.g., 0123456789"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingMethod ? 'Update' : 'Add'} Payment Method
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAddDialog(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Default Cash Method */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Cash</h4>
                  <p className="text-sm text-muted-foreground">Default payment method</p>
                </div>
              </div>
              <Badge variant="default">Always Active</Badge>
            </div>
          </div>

          {/* Custom Payment Methods */}
          {paymentMethods.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Custom Payment Methods</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAccountNumbers(!showAccountNumbers)}
                >
                  {showAccountNumbers ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Numbers
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Numbers
                    </>
                  )}
                </Button>
              </div>
              
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Status</TableHead>
                      {(isOwner || canManage) && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethods.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell className="font-medium">{method.name}</TableCell>
                        <TableCell>{method.provider}</TableCell>
                        <TableCell className="font-mono">
                          {showAccountNumbers ? method.account_number : maskAccountNumber(method.account_number)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={method.is_active ? "default" : "secondary"}>
                            {method.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {(isOwner || canManage) && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={method.is_active}
                                onCheckedChange={(checked) => toggleActive(method.id, checked)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(method)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(method.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No custom payment methods configured</p>
              <p className="text-sm">Add payment methods like bank accounts or mobile money</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
