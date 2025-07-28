import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, Clock, CheckCircle, XCircle, MessageCircle, Phone, Mail, Eye, Filter } from 'lucide-react';
import { useCurrentStore } from '@/stores/storeStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/taxUtils';
import { generateOrderWhatsAppMessage, openWhatsApp } from '@/lib/whatsapp-utils';
import { PublicOrderModal } from './PublicOrderModal';

interface PublicOrder {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled';
  notes?: string;
  whatsapp_sent: boolean;
  whatsapp_sent_at?: string;
  created_at: string;
  updated_at: string;
  items?: Array<{
    id: string;
    product_name: string;
    product_image_url?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    selected_variants: Record<string, string>;
  }>;
  public_order_items?: Array<{
    id: string;
    product_name: string;
    product_image_url?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    selected_variants: Record<string, string>;
  }>;
}

export function PublicOrdersView() {
  const currentStore = useCurrentStore();
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<PublicOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (currentStore?.id) {
      loadOrders();
    }
  }, [currentStore?.id]);

  const loadOrders = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);
      
      const query = supabase
        .from('public_orders')
        .select(`
          *,
          public_order_items (
            id,
            product_name,
            product_image_url,
            quantity,
            unit_price,
            total_price,
            selected_variants
          )
        `)
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Map the data to ensure items are properly assigned
      const mappedOrders = (data || []).map(order => ({
        ...order,
        items: order.public_order_items || []
      }));

      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: PublicOrder['status']) => {
    try {
      const { error } = await supabase
        .from('public_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order status updated');
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const sendWhatsAppMessage = async (order: PublicOrder) => {
    if (!currentStore?.phone) {
      toast.error('Store phone number not configured');
      return;
    }

    try {
      const orderData = {
        orderCode: order.order_code,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        items: (order.items || []).map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          variants: item.selected_variants
        })),
        subtotal: order.subtotal,
        taxAmount: order.tax_amount,
        total: order.total,
        storeName: currentStore.name,
        currency: currentStore.currency || 'USD'
      };

      const message = generateOrderWhatsAppMessage(orderData);
      openWhatsApp(currentStore.phone, message);

      // Mark as WhatsApp sent
      await supabase
        .from('public_orders')
        .update({
          whatsapp_sent: true,
          whatsapp_sent_at: new Date().toISOString()
        })
        .eq('id', order.id);

      toast.success('WhatsApp message opened');
      loadOrders();
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast.error('Failed to send WhatsApp message');
    }
  };

  const getStatusColor = (status: PublicOrder['status']) => {
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

  const getStatusIcon = (status: PublicOrder['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => ['confirmed', 'processing'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage orders from your public showcase
          </p>
        </div>
        <Button onClick={loadOrders} variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{orderStats.total}</p>
              </div>
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{orderStats.pending}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Processing</p>
                <p className="text-xl font-bold text-blue-600">{orderStats.processing}</p>
              </div>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-green-600">{orderStats.completed}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by order code or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="h-9"
              >
                Clear
              </Button>
            )}
          </div>

          {searchQuery && filteredOrders.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              No orders found matching "{searchQuery}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-4 h-4" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-6">
              <Package className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <h3 className="text-base font-medium mb-1">No orders found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Orders from your public showcase will appear here.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono font-medium text-sm">{order.order_code}</span>
                        <Badge className={`${getStatusColor(order.status)} border-0 text-xs`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                        </Badge>
                        {order.whatsapp_sent && (
                          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Sent
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Customer: <span className="font-medium">{order.customer_name}</span></div>
                          <div>Total: <span className="font-medium">{formatCurrency(order.total, currentStore?.currency || 'USD')}</span></div>
                          <div>Items: <span className="font-medium">{order.items?.length || 0}</span></div>
                          <div>Date: <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span></div>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {order.items.slice(0, 2).map((item, index) => (
                              <span key={item.id}>
                                {item.product_name} (x{item.quantity})
                                {index < Math.min(order.items!.length, 2) - 1 && ', '}
                              </span>
                            ))}
                            {order.items.length > 2 && (
                              <span> +{order.items.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>

                      {currentStore?.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendWhatsAppMessage(order)}
                          className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                      )}

                      <Select
                        value={order.status}
                        onValueChange={(value: PublicOrder['status']) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Modal */}
      <PublicOrderModal
        order={selectedOrder}
        open={showOrderModal}
        onOpenChange={setShowOrderModal}
        onOrderUpdate={loadOrders}
      />
    </div>
  );
}
