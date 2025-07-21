import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { toast } from "sonner";
import { useSettingsStore, type PaymentMethod } from "@/stores/settingsStore";

interface PaymentMethodFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingMethod?: PaymentMethod | null;
  onSuccess: () => void;
}

export function PaymentMethodForm({
  isOpen,
  onClose,
  editingMethod,
  onSuccess
}: PaymentMethodFormProps) {
  const currentStore = useCurrentStore();
  const user = useUser();

  // Form state
  const [methodName, setMethodName] = useState('');
  const [provider, setProvider] = useState('mpesa');
  const [accountNumber, setAccountNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store actions
  const addPaymentMethod = useSettingsStore(state => state.addPaymentMethod);
  const updatePaymentMethod = useSettingsStore(state => state.updatePaymentMethod);

  // Update form when editing method changes
  useEffect(() => {
    if (editingMethod) {
      setMethodName(editingMethod.name || '');
      setProvider(editingMethod.provider || 'mpesa');
      setAccountNumber(editingMethod.account_number || '');
      setIsActive(editingMethod.is_active ?? true);
    } else {
      setMethodName('');
      setProvider('mpesa');
      setAccountNumber('');
      setIsActive(true);
    }
  }, [editingMethod]);

  const handleSubmit = async () => {
    if (!currentStore?.id || !methodName.trim() || !accountNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const methodData = {
        name: methodName.trim(),
        provider,
        account_number: accountNumber.trim(),
        is_active: isActive,
        created_by: user?.id,
      };

      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, methodData);
        toast.success('Payment method updated successfully!');
      } else {
        await addPaymentMethod(currentStore.id, methodData);
        toast.success('Payment method added successfully!');
      }

      // Reset form
      setMethodName('');
      setProvider('mpesa');
      setAccountNumber('');
      setIsActive(true);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error('Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
          </DialogTitle>
          <DialogDescription>
            {editingMethod 
              ? 'Update the payment method details below.'
              : 'Add a new payment method for your store.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="method-name">Method Name *</Label>
            <Input
              id="method-name"
              placeholder="e.g., M-Pesa Till Number"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider *</Label>
            <Select value={provider} onValueChange={setProvider} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="airtel_money">Airtel Money</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-number">Account Number *</Label>
            <Input
              id="account-number"
              placeholder="e.g., 123456 or +265123456789"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Enter the account number, phone number, or identifier for this payment method
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is-active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Enable this payment method for transactions
              </p>
            </div>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={saving}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={saving || !methodName.trim() || !accountNumber.trim()}
              className="flex-1"
            >
              {saving ? 'Saving...' : (editingMethod ? 'Update Method' : 'Add Method')}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
