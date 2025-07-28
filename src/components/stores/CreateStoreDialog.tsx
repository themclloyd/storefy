import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus,} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/stores/authStore';
import { useStoreActions } from '@/stores/storeStore';
import { toast } from 'sonner';

interface CreateStoreDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function CreateStoreDialog({ trigger, className }: CreateStoreDialogProps) {
  const { user } = useAuth();
  const { refreshStores, selectStore } = useStore();
  const [open, setOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [creating, setCreating] = useState(false);

  // Generate a unique store code
  const generateStoreCode = useCallback((name: string) => {
    const prefix = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !storeName.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert([
          {
            owner_id: user.id,
            name: storeName.trim(),
            address: storeAddress.trim() || null,
            store_code: generateStoreCode(storeName.trim()),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Store created successfully!');
      setOpen(false);
      setStoreName('');
      setStoreAddress('');
      await refreshStores();
      
      // Auto-select the new store
      if (data) {
        selectStore(data.id);
      }
    } catch (error) {
      toast.error('Failed to create store');
      console.error('Error creating store:', error);
    } finally {
      setCreating(false);
    }
  }, [user, storeName, storeAddress, generateStoreCode, refreshStores, selectStore]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setStoreName('');
      setStoreAddress('');
      setCreating(false);
    }
  }, []);

  const defaultTrigger = (
    <Button className={className}>
      <Plus className="w-4 h-4 mr-2" />
      Add New Store
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Store</DialogTitle>
          <DialogDescription>
            Enter your store details to get started
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-store-name">Store Name *</Label>
            <Input
              id="create-store-name"
              placeholder="e.g., Downtown Electronics"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-store-address">Store Address</Label>
            <Input
              id="create-store-address"
              placeholder="123 Main Street, City"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Optional - helps identify location
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={creating}
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Store
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
