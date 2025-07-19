
import { useState, useEffect, useCallback } from 'react';
import { useStores, useCurrentStore, useStoreActions } from '@/stores/storeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Users, Crown, UserCheck, Settings, BarChart3, Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/stores/authStore';
import { toast } from 'sonner';

interface StoreStats {
  store_id: string;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  active_members: number;
}

export function StoreManagementView() {
  const stores = useStores();
  const currentStore = useCurrentStore();
  const user = useUser();
  const { selectStore, refreshStores } = useStoreActions();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [creating, setCreating] = useState(false);
  const [storeStats, setStoreStats] = useState<StoreStats[]>([]);

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

  const fetchStoreStats = async () => {
    if (stores.length === 0) return;

    const statsPromises = stores.map(async (store) => {
      try {
        // Get products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id);

        // Get orders count and revenue
        const { data: ordersData, count: ordersCount } = await supabase
          .from('orders')
          .select('total', { count: 'exact' })
          .eq('store_id', store.id);

        // Get active members count
        const { count: membersCount } = await supabase
          .from('store_members')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .eq('is_active', true);

        const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

        return {
          store_id: store.id,
          total_products: productsCount || 0,
          total_orders: ordersCount || 0,
          total_revenue: totalRevenue,
          active_members: membersCount || 0,
        };
      } catch (error) {
        console.error(`Error fetching stats for store ${store.id}:`, error);
        return {
          store_id: store.id,
          total_products: 0,
          total_orders: 0,
          total_revenue: 0,
          active_members: 0,
        };
      }
    });

    const stats = await Promise.all(statsPromises);
    setStoreStats(stats);
  };

  useEffect(() => {
    if (stores.length > 0) {
      fetchStoreStats();
    }
  }, [stores]);

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

  const getStoreStats = (storeId: string) => {
    return storeStats.find(stat => stat.store_id === storeId) || {
      store_id: storeId,
      total_products: 0,
      total_orders: 0,
      total_revenue: 0,
      active_members: 0,
    };
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
                    <Label htmlFor="firstStoreName">Store Name *</Label>
                    <Input
                      id="firstStoreName"
                      placeholder="Enter store name"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstStoreAddress">Address (Optional)</Label>
                    <Input
                      id="firstStoreAddress"
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

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="w-full max-w-6xl mx-auto card-professional">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Building2 className="w-6 h-6" />
            Store Management Dashboard
          </CardTitle>
          <p className="text-muted-foreground">
            Manage all your stores from one central location
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {stores.map((store) => {
              const stats = getStoreStats(store.id);
              return (
                <Card
                  key={store.id}
                  className={`cursor-pointer transition-smooth hover:shadow-medium ${
                    currentStore?.id === store.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{store.name}</h3>
                        {store.address && (
                          <p className="text-sm text-muted-foreground mt-1">{store.address}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(store.role || 'owner')}
                        <Badge variant="outline" className="text-xs">
                          {store.role || 'owner'}
                        </Badge>
                      </div>
                    </div>

                    {/* Store Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{stats.total_products}</p>
                        <p className="text-xs text-muted-foreground">Products</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-success">{stats.total_orders}</p>
                        <p className="text-xs text-muted-foreground">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-warning">${stats.total_revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-info">{stats.active_members}</p>
                        <p className="text-xs text-muted-foreground">Team</p>
                      </div>
                    </div>

                    {/* Store Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          selectStore(store.id);
                          window.location.href = '/';
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          selectStore(store.id);
                          window.location.href = '/?view=reports';
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Reports
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          selectStore(store.id);
                          window.location.href = '/?view=settings';
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Store
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
                    <Label htmlFor="newStoreName">Store Name *</Label>
                    <Input
                      id="newStoreName"
                      placeholder="Enter store name"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newStoreAddress">Address (Optional)</Label>
                    <Input
                      id="newStoreAddress"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
