import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Users, Crown, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function StoreSelector() {
  const { stores, currentStore, selectStore, refreshStores } = useStore();
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [creating, setCreating] = useState(false);

  // Generate a unique store code
  const generateStoreCode = (storeName: string) => {
    const prefix = storeName.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
    const suffix = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return prefix + suffix;
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newStoreName.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert([
          {
            owner_id: user.id,
            name: newStoreName.trim(),
            address: newStoreAddress.trim() || null,
            store_code: generateStoreCode(newStoreName.trim()),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Store created successfully!');
      setShowCreateDialog(false);
      setNewStoreName('');
      setNewStoreAddress('');
      await refreshStores();
      
      // Auto-select the new store
      if (data) {
        // Initialize sample data for the new store
        await supabase.rpc('initialize_sample_data', { _store_id: data.id });
        selectStore(data.id);
      }
    } catch (error) {
      toast.error('Failed to create store');
      console.error('Error creating store:', error);
    } finally {
      setCreating(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-warning" />;
      case 'manager':
        return <UserCheck className="w-4 h-4 text-primary" />;
      case 'cashier':
        return <Users className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Building2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (stores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md card-professional">
          <CardHeader className="text-center">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle>No Stores Found</CardTitle>
            <p className="text-muted-foreground">
              Create your first store to get started with Storefy
            </p>
          </CardHeader>
          <CardContent>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Store
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Store</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateStore} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      placeholder="Enter store name"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeAddress">Address (Optional)</Label>
                    <Input
                      id="storeAddress"
                      placeholder="Enter store address"
                      value={newStoreAddress}
                      onChange={(e) => setNewStoreAddress(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary text-white"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create Store'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stores.length === 1) {
    // Auto-select single store and redirect
    if (!currentStore) {
      selectStore(stores[0].id);
    }
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl card-professional">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Building2 className="w-6 h-6" />
            Select Store
          </CardTitle>
          <p className="text-muted-foreground">
            Choose which store you'd like to manage
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {stores.map((store) => (
              <Card
                key={store.id}
                className={`cursor-pointer transition-smooth hover:shadow-medium ${
                  currentStore?.id === store.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => selectStore(store.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{store.name}</h3>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(store.role || 'owner')}
                      <Badge variant="outline" className="text-xs">
                        {store.role || 'owner'}
                      </Badge>
                    </div>
                  </div>
                  {store.address && (
                    <p className="text-sm text-muted-foreground">{store.address}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Store
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Store</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateStore} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      placeholder="Enter store name"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeAddress">Address (Optional)</Label>
                    <Input
                      id="storeAddress"
                      placeholder="Enter store address"
                      value={newStoreAddress}
                      onChange={(e) => setNewStoreAddress(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary text-white"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create Store'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              className="bg-gradient-primary text-white"
              disabled={!currentStore}
              onClick={() => {
                if (currentStore) {
                  // Force re-render by navigating to root
                  window.location.reload();
                }
              }}
            >
              Continue to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}