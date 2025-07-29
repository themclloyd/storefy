import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Edit,
  Loader2
} from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { toast } from "sonner";
import { useTax } from "@/hooks/useTax";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  total_orders: number | null;
  total_spent: number | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
  items_count?: number;
}

interface CustomerDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onEditCustomer: (customer: Customer) => void;
}

export function CustomerDetailsModal({
  open,
  onOpenChange,
  customer,
  onEditCustomer
}: CustomerDetailsModalProps) {
  const currentStore = useCurrentStore();
  const { from, currentStoreId, isPinSession } = useSupabaseClient();
  const { formatCurrency } = useTax();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchCustomerOrders = useCallback(async () => {
    const storeId = currentStoreId || currentStore?.id;
    if (!customer || !storeId) return;

    setLoading(true);
    try {
      const { data, error } = await from('orders')
        .select(`
          id,
          order_number,
          total,
          status,
          payment_method,
          created_at
        `)
        .eq('customer_id', customer.id)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer orders:', error);
        toast.error('Failed to load customer orders');
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      toast.error('Failed to load customer orders');
    } finally {
      setLoading(false);
    }
  }, [customer, currentStore, currentStoreId, from]);

  useEffect(() => {
    if (open && customer && ((currentStore && !isPinSession) || (currentStoreId && isPinSession))) {
      fetchCustomerOrders();
    }
  }, [open, customer, currentStore, currentStoreId, isPinSession, fetchCustomerOrders]);

  if (!customer) return null;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'vip':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'text-muted-foreground';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      case 'refunded':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const recentOrders = orders.slice(0, 5);
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              <div>
                <span className="text-xl">{customer.name}</span>
                <Badge 
                  className={`ml-3 ${getStatusColor(customer.status)}`}
                  variant="secondary"
                >
                  {(customer.status || 'active').toUpperCase()}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditCustomer(customer)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogTitle>
          <DialogDescription>
            View detailed customer information, order history, and analytics.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.phone || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <span>{customer.address || 'No address provided'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Member since {new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      <span>Total Orders</span>
                    </div>
                    <span className="font-semibold">{customer.total_orders || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-success" />
                      <span>Total Spent</span>
                    </div>
                    <span className="font-semibold text-success">
                      {formatCurrency(customer.total_spent || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-warning" />
                      <span>Average Order</span>
                    </div>
                    <span className="font-semibold">
                      ${averageOrderValue.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2">Loading orders...</span>
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">#{order.order_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${order.total.toFixed(2)}</div>
                          <Badge 
                            className={getOrderStatusColor(order.status)}
                            variant="secondary"
                          >
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders found for this customer
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complete Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2">Loading orders...</span>
                  </div>
                ) : orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.order_number}</TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-semibold">${order.total.toFixed(2)}</TableCell>
                          <TableCell className="capitalize">{order.payment_method}</TableCell>
                          <TableCell>
                            <Badge 
                              className={getOrderStatusColor(order.status)}
                              variant="secondary"
                            >
                              {order.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders found for this customer
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    ${totalRevenue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Order Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${averageOrderValue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Order Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.length} orders
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Purchase Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Customer analytics and insights will be displayed here based on purchase history and behavior patterns.
                  </div>
                  {orders.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">First Order:</span>
                        <span className="ml-2 font-medium">
                          {new Date(orders[orders.length - 1]?.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Order:</span>
                        <span className="ml-2 font-medium">
                          {new Date(orders[0]?.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
