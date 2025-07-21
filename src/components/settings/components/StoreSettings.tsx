import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store } from "lucide-react";
import { useCurrentStore, useStoreStore } from "@/stores/storeStore";
import { clearTaxCache, percentageToDecimal, isValidTaxRate, WORLD_CURRENCIES } from "@/lib/taxUtils";
import { toast } from "sonner";
import {
  useSettingsStore,
  useStoreSettings
} from "@/stores/settingsStore";

export function StoreSettings() {
  const currentStore = useCurrentStore();
  const { updateCurrentStore } = useStoreStore();

  // Use Zustand store state
  const storeSettings = useStoreSettings();
  const updatingStore = useSettingsStore(state => state.updatingStore);
  
  // Actions from Zustand
  const setStoreSettings = useSettingsStore(state => state.setStoreSettings);
  const updateStoreSettings = useSettingsStore(state => state.updateStoreSettings);

  const handleUpdateStore = async () => {
    if (!currentStore?.id || !storeSettings.storeName.trim()) {
      toast.error('Store name is required');
      return;
    }

    // Validate tax rate
    const taxRateDecimal = percentageToDecimal(parseFloat(storeSettings.storeTaxRate));
    if (isNaN(taxRateDecimal) || !isValidTaxRate(taxRateDecimal)) {
      toast.error('Tax rate must be a valid percentage between 0 and 100');
      return;
    }

    // Validate email if provided
    if (storeSettings.storeEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeSettings.storeEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    await updateStoreSettings(currentStore.id, storeSettings);

    // Clear tax cache since tax rate might have changed
    clearTaxCache();

    // Update the current store in context
    updateCurrentStore({
      name: storeSettings.storeName.trim(),
      address: storeSettings.storeAddress.trim() || undefined,
      phone: storeSettings.storePhone.trim() || undefined,
      email: storeSettings.storeEmail.trim() || undefined,
      currency: storeSettings.storeCurrency,
      tax_rate: taxRateDecimal,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5" />
          Store Information
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Update your store's basic information and settings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Store Name *</Label>
            <Input
              id="store-name"
              placeholder="Enter your store name"
              value={storeSettings.storeName}
              onChange={(e) => setStoreSettings({ storeName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-address">Address</Label>
            <Input
              id="store-address"
              placeholder="Enter store address"
              value={storeSettings.storeAddress}
              onChange={(e) => setStoreSettings({ storeAddress: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="store-phone">Phone Number</Label>
            <Input
              id="store-phone"
              type="tel"
              placeholder="Enter phone number"
              value={storeSettings.storePhone}
              onChange={(e) => setStoreSettings({ storePhone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-email">Email Address</Label>
            <Input
              id="store-email"
              type="email"
              placeholder="Enter email address"
              value={storeSettings.storeEmail}
              onChange={(e) => setStoreSettings({ storeEmail: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="store-currency">Currency</Label>
            <Select value={storeSettings.storeCurrency} onValueChange={(value) => setStoreSettings({ storeCurrency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORLD_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-tax-rate">Tax Rate (%)</Label>
            <Input
              id="store-tax-rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Enter tax rate (e.g., 8.25)"
              value={storeSettings.storeTaxRate}
              onChange={(e) => setStoreSettings({ storeTaxRate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Enter the tax rate as a percentage (e.g., 8.25 for 8.25%)
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleUpdateStore();
            }}
            disabled={updatingStore || !storeSettings.storeName.trim()}
            className="w-full md:w-auto"
          >
            {updatingStore ? 'Updating...' : 'Update Store Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
