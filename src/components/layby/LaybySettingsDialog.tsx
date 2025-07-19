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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Settings, 
  Percent, 
  Calendar, 
  Bell,
  DollarSign,
  Package,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const settingsSchema = z.object({
  require_deposit_percent: z.number().min(0).max(100).default(20),
  max_layby_duration_days: z.number().min(1).max(365).default(90),
  automatic_reminders_enabled: z.boolean().default(true),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface LaybySettings {
  id?: string;
  store_id: string;
  require_deposit_percent: number;
  max_layby_duration_days: number;
  automatic_reminders_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LaybySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsUpdated?: () => void;
}

export function LaybySettingsDialog({ 
  open, 
  onOpenChange, 
  onSettingsUpdated 
}: LaybySettingsDialogProps) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingSettings, setExistingSettings] = useState<LaybySettings | null>(null);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      require_deposit_percent: 20,
      max_layby_duration_days: 90,
      automatic_reminders_enabled: true,
    },
  });

  useEffect(() => {
    if (open && currentStore) {
      fetchSettings();
    }
  }, [open, currentStore]);

  const fetchSettings = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('layby_settings')
        .select('*')
        .eq('store_id', currentStore.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching layby settings:', error);
        toast.error('Failed to load layby settings');
        return;
      }

      if (data) {
        setExistingSettings(data);
        form.reset({
          require_deposit_percent: data.require_deposit_percent,
          max_layby_duration_days: data.max_layby_duration_days,
          automatic_reminders_enabled: data.automatic_reminders_enabled,
        });
      }
    } catch (error) {
      console.error('Error fetching layby settings:', error);
      toast.error('Failed to load layby settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    if (!currentStore || !user) {
      toast.error("Store or user information not available");
      return;
    }

    try {
      setSaving(true);

      const settingsData = {
        store_id: currentStore.id,
        ...data,
      };

      let result;
      if (existingSettings) {
        // Update existing settings
        result = await supabase
          .from('layby_settings')
          .update(settingsData)
          .eq('id', existingSettings.id);
      } else {
        // Create new settings
        result = await supabase
          .from('layby_settings')
          .insert(settingsData);
      }

      if (result.error) {
        console.error('Error saving layby settings:', result.error);
        toast.error('Failed to save layby settings');
        return;
      }

      toast.success('Layby settings saved successfully');
      onSettingsUpdated?.();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error saving layby settings:', error);
      toast.error('Failed to save layby settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#2CA01C]" />
            Layby Settings
          </DialogTitle>
          <DialogDescription>
            Configure layby system settings including deposit requirements and payment reminders.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="require_deposit_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Deposit (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="20.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_layby_duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Duration (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="90"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="automatic_reminders_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Automatic Reminders
                      </FormLabel>
                      <FormDescription className="text-sm">
                        Send payment reminders to customers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#2CA01C] hover:bg-[#2CA01C]/90"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
