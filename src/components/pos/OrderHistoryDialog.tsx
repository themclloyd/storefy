import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Calendar,
  DollarSign,
  User,
  Receipt,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { usePOSStore, useOrders, useOrdersLoading } from "@/stores/posStore";

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
  customer_id: string | null;
  customers?: {
    name: string;
    email: string | null;
  } | null;
}

interface OrderHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderHistoryDialog({ open, onOpenChange }: OrderHistoryDialogProps) {
  const currentStore = useCurrentStore();

  // Use Zustand store state
  const orders = useOrders();
  const loading = useOrdersLoading();
  const searchTerm = usePOSStore(state => state.orderSearchTerm);
  const statusFilter = usePOSStore(state => state.orderStatusFilter);
  const setSearchTerm = usePOSStore(state => state.setOrderSearchTerm);
  const setStatusFilter = usePOSStore(state => state.setOrderStatusFilter);
  const fetchOrders = usePOSStore(state => state.fetchOrders);
  const refundOrder = usePOSStore(state => state.refundOrder);

  useEffect(() => {
    if (open && currentStore?.id) {
      fetchOrders(currentStore.id);
    }
  }, [open, currentStore?.id, fetchOrders]);

  const handleRefund = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to refund order ${orderNumber}?`)) {
      return;
    }

    await refundOrder(orderId, orderNumber);

    // Refresh orders after refund
    if (currentStore?.id) {
      fetchOrders(currentStore.id);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="border-warning/20 text-warning"><RefreshCw className="w-3 h-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Recent Orders
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search orders, customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <Button
            onClick={() => currentStore?.id && fetchOrders(currentStore.id)}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Separator />

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all" ? 'No orders found matching your criteria' : 'No orders found'}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium text-foreground">#{order.order_number}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-lg">${order.total.toFixed(2)}</span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {order.customers ? (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.customers.name}
                        </div>
                      ) : (
                        <span>Walk-in Customer</span>
                      )}
                      <span className="capitalize">{order.payment_method}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {order.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefund(order.id, order.order_number)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Refund
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
