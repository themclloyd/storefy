import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import {
  useSettingsStore,
  usePaymentMethods,
  type PaymentMethod
} from "@/stores/settingsStore";

// Import refactored payment components
import { PaymentMethodCard } from "./payments/PaymentMethodCard";
import { PaymentMethodForm } from "./payments/PaymentMethodForm";

export function PaymentMethodsSettings() {
  const currentStore = useCurrentStore();
  
  // Use Zustand store state
  const paymentMethods = usePaymentMethods();
  const loading = useSettingsStore(state => state.loading);
  const showAccountNumbers = useSettingsStore(state => state.showAccountNumbers);
  
  // Actions from Zustand
  const setShowAccountNumbers = useSettingsStore(state => state.setShowAccountNumbers);
  const fetchPaymentMethods = useSettingsStore(state => state.fetchPaymentMethods);
  const deletePaymentMethod = useSettingsStore(state => state.deletePaymentMethod);

  // Local dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (currentStore?.id) {
      fetchPaymentMethods(currentStore.id);
    }
  }, [currentStore?.id, fetchPaymentMethods]);

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setShowEditDialog(true);
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (confirm(`Are you sure you want to delete "${method.name}"?`)) {
      await deletePaymentMethod(method.id);
    }
  };

  const handleFormSuccess = () => {
    if (currentStore?.id) {
      fetchPaymentMethods(currentStore.id);
    }
  };

  const handleCloseEdit = () => {
    setShowEditDialog(false);
    setEditingMethod(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading payment methods...</span>
      </div>
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
                Manage payment methods available for your store transactions
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No payment methods configured</p>
              <p className="text-sm">Add payment methods to start accepting payments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  paymentMethod={method}
                  showAccountNumbers={showAccountNumbers}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleAccountNumbers={() => setShowAccountNumbers(!showAccountNumbers)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <PaymentMethodForm
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Payment Method Dialog */}
      <PaymentMethodForm
        isOpen={showEditDialog}
        onClose={handleCloseEdit}
        editingMethod={editingMethod}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
