import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  User, 
  Phone, 
  MessageCircle, 
  Check, 
  X, 
  Plus, 
  Minus,
  ShoppingCart,
  UserPlus,
  DollarSign
} from 'lucide-react';
import { useCurrentStore } from '@/stores/storeStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/taxUtils';

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
  created_at: string;
  updated_at: string;
  items?: Array<{
    id: string;
    product_id: string;
    product_name: string;
    product_image_url?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    selected_variants: Record<string, string>;
  }>;
  public_order_items?: Array<{
    id: string;
    product_id: string;
    product_name: string;
    product_image_url?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    selected_variants: Record<string, string>;
  }>;
}

interface PublicOrderModalProps {
  order: PublicOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdate: () => void;
}

export function PublicOrderModal({ order, open, onOpenChange, onOrderUpdate }: PublicOrderModalProps) {
  const currentStore = useCurrentStore();
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderStatus, setOrderStatus] = useState<string>('pending');
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (order) {
      setCustomerName(order.customer_name);
      setCustomerPhone(order.customer_phone);
      setOrderStatus(order.status);
      // Handle both 'items' and 'public_order_items' for backward compatibility
      setOrderItems(order.items || order.public_order_items || []);
      setNotes(order.notes || '');
    }
  }, [order]);

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setOrderItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            quantity: newQuantity,
            total_price: item.unit_price * newQuantity
          }
        : item
    ));
  };

  const removeItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateNewTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = 0; // Can be configured per store
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const updateOrder = async () => {
    if (!order || !currentStore) return;

    try {
      setLoading(true);

      const { subtotal, taxAmount, total } = calculateNewTotal();

      // Update order
      const { error: orderError } = await supabase
        .from('public_orders')
        .update({
          customer_name: customerName,
          customer_phone: customerPhone,
          status: orderStatus,
          subtotal,
          tax_amount: taxAmount,
          total,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Update order items
      for (const item of orderItems) {
        const { error: itemError } = await supabase
          .from('public_order_items')
          .update({
            quantity: item.quantity,
            total_price: item.total_price
          })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      toast.success('Order updated successfully');
      onOrderUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const completeOrder = async () => {
    if (!order || !currentStore || !customerName.trim() || !customerPhone.trim()) {
      toast.error('Please provide customer name and phone number');
      return;
    }

    try {
      setLoading(true);

      // Use the comprehensive RPC function
      const { data, error } = await supabase.rpc('complete_public_order', {
        p_order_id: order.id,
        p_customer_name: customerName.trim(),
        p_customer_phone: customerPhone.trim(),
        p_payment_method: 'cash' // Default payment method
      });

      if (error) throw error;

      toast.success(`Order completed successfully! Customer added and sale recorded. Transaction ID: ${data.transaction_id}`);
      onOrderUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error(`Failed to complete order: ${error.message}`);
    } finally {
      setLoading(false);
    }
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

  if (!order) return null;

  const { subtotal, taxAmount, total } = calculateNewTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="w-4 h-4" />
            Order {order.order_code}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Manage order details, customer information, and order status
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Customer & Status */}
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customerName" className="text-xs">Name *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer name"
                      className={`h-8 text-sm ${!customerName.trim() ? 'border-red-300' : ''}`}
                    />
                    {!customerName.trim() && (
                      <p className="text-xs text-red-600 mt-1">Required</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerPhone" className="text-xs">Phone *</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                      className={`h-8 text-sm ${!customerPhone.trim() ? 'border-red-300' : ''}`}
                    />
                    {!customerPhone.trim() && (
                      <p className="text-xs text-red-600 mt-1">Required</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Status</h3>
                <div className="space-y-2">
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger className="h-8 text-sm">
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
                  <Badge className={`${getStatusColor(orderStatus)} border-0 text-xs`}>
                    {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs">Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Order notes..."
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Middle & Right Columns - Order Items */}
            <div className="lg:col-span-2 space-y-3">

              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Order Items ({orderItems.length})
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {orderItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.product_name}</h4>
                        <p className="text-xs text-gray-600">
                          {formatCurrency(item.unit_price, currentStore?.currency || 'USD')} each
                        </p>
                        {Object.keys(item.selected_variants).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.entries(item.selected_variants).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 text-right">
                      <span className="text-sm font-medium">
                        {formatCurrency(item.total_price, currentStore?.currency || 'USD')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal, currentStore?.currency || 'USD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>{formatCurrency(taxAmount, currentStore?.currency || 'USD')}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Total:</span>
                  <span>{formatCurrency(total, currentStore?.currency || 'USD')}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Cancel
          </Button>
          <Button
            onClick={updateOrder}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
          {orderStatus !== 'completed' && orderStatus !== 'cancelled' && (
            <Button
              onClick={completeOrder}
              disabled={loading || !customerName || !customerPhone}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Check className="w-3 h-3 mr-1" />
              {loading ? 'Completing...' : 'Complete Order'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
