import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  MapPin,
  DollarSign,
  Users,
  BarChart3,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InlineLoading } from '@/components/ui/modern-loading';

interface SystemStore {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  currency: string;
  tax_rate: number;
  store_code: string;
  created_at: string;
  owner_email?: string;
  owner_name?: string;
  total_revenue?: number;
  total_transactions?: number;
  total_products?: number;
  is_active?: boolean;
}

export function StoreManagement() {
  const [stores, setStores] = useState<SystemStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching system stores...');

      // Get all stores with owner information
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select(`
          *,
          profiles!stores_owner_id_fkey(display_name)
        `);

      if (storesError) {
        console.error('Error fetching stores:', storesError);
        toast.error('Failed to fetch stores');
        return;
      }

      // Get additional metrics for each store
      const storesWithMetrics = await Promise.all(
        (storesData || []).map(async (store) => {
          // Get total revenue
          const { data: revenueData } = await supabase
            .from('transactions')
            .select('amount')
            .eq('store_id', store.id);

          const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

          // Get transaction count
          const { count: transactionCount } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id);

          // Get product count
          const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .eq('is_active', true);

          // Get owner email from profiles (since we don't have admin access)
          let ownerEmail = 'Unknown';
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', store.owner_id)
              .single();
            ownerEmail = profileData?.display_name || 'Unknown';
          } catch (error) {
            console.warn('Could not fetch owner profile for store:', store.id);
          }

          return {
            ...store,
            owner_email: ownerEmail,
            owner_name: store.profiles?.display_name || 'Unknown',
            total_revenue: totalRevenue,
            total_transactions: transactionCount || 0,
            total_products: productCount || 0,
            is_active: true // You could add logic to determine if store is active
          };
        })
      );

      console.log('🏪 Stores fetched:', storesWithMetrics.length);
      setStores(storesWithMetrics);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStores();
    setRefreshing(false);
    toast.success('Stores refreshed');
  };

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (!confirm(`Are you sure you want to delete store: ${storeName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);
      
      if (error) {
        console.error('Error deleting store:', error);
        toast.error('Failed to delete store');
        return;
      }

      toast.success('Store deleted successfully');
      await fetchStores(); // Refresh the list
    } catch (error) {
      console.error('Error deleting store:', error);
      toast.error('Failed to delete store');
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.store_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = stores.reduce((sum, store) => sum + (store.total_revenue || 0), 0);
  const totalTransactions = stores.reduce((sum, store) => sum + (store.total_transactions || 0), 0);
  const totalProducts = stores.reduce((sum, store) => sum + (store.total_products || 0), 0);

  if (loading) {
    return (
      <div className="p-6">
        <InlineLoading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Store Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stores.length}</div>
                    <p className="text-sm text-muted-foreground">Total Stores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{totalTransactions}</div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{totalProducts}</div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search stores by name, code, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stores Table */}
          <div className="border rounded-lg">
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 font-medium text-sm">
              <div className="col-span-3">Store</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-2">Revenue</div>
              <div className="col-span-2">Products</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1">Actions</div>
            </div>
            
            {filteredStores.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? 'No stores found matching your search.' : 'No stores found.'}
              </div>
            ) : (
              filteredStores.map((store) => (
                <div key={store.id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50">
                  <div className="col-span-3">
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-sm text-muted-foreground">Code: {store.store_code}</p>
                      {store.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {store.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div>
                      <p className="text-sm font-medium">{store.owner_name}</p>
                      <p className="text-xs text-muted-foreground">{store.owner_email}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div>
                      <p className="font-medium">${(store.total_revenue || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {store.total_transactions} transactions
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm">{store.total_products || 0} products</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm">
                      {new Date(store.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteStore(store.id, store.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
