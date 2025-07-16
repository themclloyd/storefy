import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Users, Crown, UserCheck, Store, Sparkles, ArrowRight, LogOut, ShoppingBag, MapPin, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PremiumStoreSelector } from './PremiumStoreSelector';

export function StoreSelector() {
  // Use the premium store selector for better UX
  return <PremiumStoreSelector />;
}

// Keep the old implementation as backup
export function LegacyStoreSelector() {
  const { stores, currentStore, selectStore, refreshStores, clearStoreSelection } = useStore();
  const { user, signOut } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [creating, setCreating] = useState(false);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!showCreateDialog) {
      setNewStoreName('');
      setNewStoreAddress('');
      setCreating(false);
    }
  }, [showCreateDialog]);

  // Generate a unique store code
  const generateStoreCode = (storeName: string) => {
    const prefix = storeName.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
    const suffix = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return prefix + suffix;
  };

  const handleCreateStore = useCallback(async (e: React.FormEvent) => {
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
        selectStore(data.id);
      }
    } catch (error) {
      toast.error('Failed to create store');
      console.error('Error creating store:', error);
    } finally {
      setCreating(false);
    }
  }, [user, newStoreName, newStoreAddress, refreshStores, selectStore]);

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
                  <DialogDescription>
                    Enter your store details to get started with Storefy
                  </DialogDescription>
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
    // For single store, still show selection UI to ensure explicit user action
    // This prevents automatic bypassing of store selection
    const singleStore = stores[0];

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Access Your Store
            </CardTitle>
            <p className="text-muted-foreground">
              Click below to access your store dashboard
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card
              className="cursor-pointer transition-all duration-300 hover:shadow-lg border-2 border-primary/20 hover:border-primary hover:scale-[1.02] bg-gradient-to-r from-primary/5 to-primary/10"
              onClick={() => selectStore(singleStore.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">{singleStore.name}</h3>
                {singleStore.address && (
                  <p className="text-sm text-muted-foreground mb-3">{singleStore.address}</p>
                )}
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {singleStore.role === 'owner' ? '👑 Owner' : `👤 ${singleStore.role || 'Member'}`}
                </Badge>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-xs text-muted-foreground bg-amber-50 text-amber-700 px-3 py-2 rounded-full inline-block">
                ⚠️ Store selection required to continue
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-4xl shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Select Your Store
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Choose which store you'd like to manage today
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              ⚠️ Store selection required to continue
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Card
                key={store.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 ${
                  currentStore?.id === store.id
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-gray-200 hover:border-primary/50 bg-gradient-to-br from-white to-gray-50/50'
                }`}
                onClick={() => selectStore(store.id)}
              >
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      currentStore?.id === store.id ? 'bg-primary/20' : 'bg-primary/10'
                    }`}>
                      <Building2 className={`w-8 h-8 ${
                        currentStore?.id === store.id ? 'text-primary' : 'text-primary/70'
                      }`} />
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{store.name}</h3>
                      {store.address && (
                        <p className="text-sm text-muted-foreground mb-3">{store.address}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      {getRoleIcon(store.role || 'owner')}
                      <Badge
                        variant={currentStore?.id === store.id ? "default" : "secondary"}
                        className={currentStore?.id === store.id
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary border-primary/20"
                        }
                      >
                        {store.role === 'owner' ? 'Owner' : store.role || 'Member'}
                      </Badge>
                    </div>

                    {currentStore?.id === store.id && (
                      <div className="mt-3">
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          ✓ Selected
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col items-center space-y-6">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Need a new store?</h3>
              <p className="text-muted-foreground">Create additional stores to manage multiple locations</p>

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Store
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <DialogTitle className="text-2xl font-bold">Create New Store</DialogTitle>
                  <p className="text-muted-foreground">Add a new store location to your account</p>
                </DialogHeader>
                <form onSubmit={handleCreateStore} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-sm font-medium">Store Name *</Label>
                    <Input
                      id="storeName"
                      placeholder="e.g., Downtown Branch, Main Store"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeAddress" className="text-sm font-medium">Store Address</Label>
                    <Input
                      id="storeAddress"
                      placeholder="123 Main Street, City, State"
                      value={newStoreAddress}
                      onChange={(e) => setNewStoreAddress(e.target.value)}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">Optional - helps identify your store location</p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-full"
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Creating Store...
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

            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground bg-blue-50 text-blue-700 px-4 py-2 rounded-full inline-block">
                💡 Select a store above to access the application
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}