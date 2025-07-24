import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Clock, CheckCircle, MessageCircle, Phone } from 'lucide-react';
import { useCurrentStore } from '@/stores/storeStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/taxUtils';
import { generateCustomerInquiryMessage, openWhatsApp } from '@/lib/whatsapp-utils';

interface OrderSearchResult {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
  items_count: number;
}

export function OrderSearchWidget() {
  const currentStore = useCurrentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<OrderSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentStore) return;

    try {
      setSearching(true);
      setNotFound(false);
      setSearchResult(null);

      const { data, error } = await supabase
        .from('public_orders')
        .select(`
          id,
          order_code,
          customer_name,
          customer_phone,
          total,
          status,
          created_at,
          public_order_items (id)
        `)
        .eq('store_id', currentStore.id)
        .eq('order_code', searchQuery.trim().toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          throw error;
        }
        return;
      }

      setSearchResult({
        ...data,
        items_count: data.public_order_items?.length || 0
      });

    } catch (error) {
      console.error('Error searching order:', error);
      toast.error('Failed to search order');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const contactCustomer = () => {
    if (!searchResult || !currentStore?.phone) return;

    const message = generateCustomerInquiryMessage({
      customerName: searchResult.customer_name,
      orderCode: searchResult.order_code,
      storeName: currentStore.name,
      total: searchResult.total,
      currency: currentStore.currency || 'USD'
    });

    openWhatsApp(searchResult.customer_phone, message);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Quick Order Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter order code (e.g., STORE-ABC123)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="font-mono"
          />
          <Button 
            onClick={handleSearch} 
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        {notFound && (
          <div className="text-center py-4 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No order found with code "{searchQuery}"</p>
            <p className="text-sm">Make sure the order code is correct</p>
          </div>
        )}

        {searchResult && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-mono font-medium text-lg">
                  {searchResult.order_code}
                </div>
                <div className="text-sm text-muted-foreground">
                  Found order
                </div>
              </div>
              <Badge className={`${getStatusColor(searchResult.status)} border-0`}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(searchResult.status)}
                  {searchResult.status.charAt(0).toUpperCase() + searchResult.status.slice(1)}
                </div>
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{searchResult.customer_name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">
                  {formatCurrency(searchResult.total, currentStore?.currency || 'USD')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items:</span>
                <span>{searchResult.items_count}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(searchResult.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={contactCustomer}
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Customer
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to full order view - you can implement this
                  toast.info('Full order view coming soon');
                }}
                className="flex-1"
              >
                View Details
              </Button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground">
          <p>💡 Tip: Customers receive order codes when they place orders through your showcase.</p>
          <p>Use this to quickly find and manage customer orders.</p>
        </div>
      </CardContent>
    </Card>
  );
}
