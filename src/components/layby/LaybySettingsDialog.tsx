import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, DollarSign, Clock, Bell, Package } from "lucide-react";

interface LaybySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LaybySettings {
  default_interest_rate: number;
  overdue_grace_period_days: number;
  automatic_reminders_enabled: boolean;
  reminder_frequency_days: number;
  max_reminder_count: number;
  default_cancellation_fee_percent: number;
  inventory_reservation_enabled: boolean;
  require_deposit_percent: number;
  max_layby_duration_days: number;
}

export function LaybySettingsDialog({ open, onOpenChange }: LaybySettingsDialogProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<LaybySettings>({
    default_interest_rate: 0.0000,
    overdue_grace_period_days: 7,
    automatic_reminders_enabled: true,
    reminder_frequency_days: 7,
    max_reminder_count: 3,
    default_cancellation_fee_percent: 0.00,
    inventory_reservation_enabled: true,
    require_deposit_percent: 20.00,
    max_layby_duration_days: 90
  });

  useEffect(() => {
    if (open && currentStore) {
      fetchSettings();
    }
  }, [open, currentStore]);

  const fetchSettings = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('layby_settings')
        .select('*')
        .eq('store_id', currentStore.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      if (data) {
        setSettings({
          default_interest_rate: data.default_interest_rate || 0.0000,
          overdue_grace_period_days: data.overdue_grace_period_days || 7,
          automatic_reminders_enabled: data.automatic_reminders_enabled ?? true,
          reminder_frequency_days: data.reminder_frequency_days || 7,
          max_reminder_count: data.max_reminder_count || 3,
          default_cancellation_fee_percent: data.default_cancellation_fee_percent || 0.00,
          inventory_reservation_enabled: data.inventory_reservation_enabled ?? true,
          require_deposit_percent: data.require_deposit_percent || 20.00,
          max_layby_duration_days: data.max_layby_duration_days || 90
        });
      }
    } catch (error) {
      console.error('Error fetching layby settings:', error);
      toast.error('Failed to load layby settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentStore || !user) {
      toast.error('Store or user not found');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('layby_settings')
        .upsert({
          store_id: currentStore.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast.success('Layby settings saved successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving layby settings:', error);
      toast.error('Failed to save layby settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof LaybySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Layby Settings
          </DialogTitle>
          <DialogDescription>
            Configure business rules and settings for layby orders in your store.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Interest & Fees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-4 h-4" />
                  Interest & Fees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interest-rate">Default Interest Rate (% per year)</Label>
                    <Input
                      id="interest-rate"
                      type="number"
                      step="0.0001"
                      min="0"
                      max="100"
                      value={settings.default_interest_rate}
                      onChange={(e) => updateSetting('default_interest_rate', parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Applied to overdue layby orders (0 = no interest)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancellation-fee">Cancellation Fee (%)</Label>
                    <Input
                      id="cancellation-fee"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.default_cancellation_fee_percent}
                      onChange={(e) => updateSetting('default_cancellation_fee_percent', parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentage of deposit retained on cancellation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-4 h-4" />
                  Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deposit-percent">Required Deposit (%)</Label>
                    <Input
                      id="deposit-percent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settings.require_deposit_percent}
                      onChange={(e) => updateSetting('require_deposit_percent', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-duration">Max Duration (days)</Label>
                    <Input
                      id="max-duration"
                      type="number"
                      min="1"
                      max="365"
                      value={settings.max_layby_duration_days}
                      onChange={(e) => updateSetting('max_layby_duration_days', parseInt(e.target.value) || 90)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grace-period">Grace Period (days)</Label>
                    <Input
                      id="grace-period"
                      type="number"
                      min="0"
                      max="30"
                      value={settings.overdue_grace_period_days}
                      onChange={(e) => updateSetting('overdue_grace_period_days', parseInt(e.target.value) || 7)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Days after due date before marking overdue
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="w-4 h-4" />
                  Automatic Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Automatic Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send payment reminders automatically
                    </p>
                  </div>
                  <Switch
                    checked={settings.automatic_reminders_enabled}
                    onCheckedChange={(checked) => updateSetting('automatic_reminders_enabled', checked)}
                  />
                </div>

                {settings.automatic_reminders_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reminder-frequency">Reminder Frequency (days)</Label>
                      <Input
                        id="reminder-frequency"
                        type="number"
                        min="1"
                        max="30"
                        value={settings.reminder_frequency_days}
                        onChange={(e) => updateSetting('reminder_frequency_days', parseInt(e.target.value) || 7)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-reminders">Max Reminders</Label>
                      <Input
                        id="max-reminders"
                        type="number"
                        min="1"
                        max="10"
                        value={settings.max_reminder_count}
                        onChange={(e) => updateSetting('max_reminder_count', parseInt(e.target.value) || 3)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventory Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-4 h-4" />
                  Inventory Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reserve Inventory for Layby Orders</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically reserve stock when layby is created
                    </p>
                  </div>
                  <Switch
                    checked={settings.inventory_reservation_enabled}
                    onCheckedChange={(checked) => updateSetting('inventory_reservation_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-gradient-primary text-white"
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
