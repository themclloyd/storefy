import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Search, DollarSign, Calendar, User, Package, AlertCircle, CheckCircle, XCircle, CreditCard, History, Settings, Eye } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTax } from "@/hooks/useTax";
import { format } from "date-fns";
import { AddLaybyDialog } from "./AddLaybyDialog";
import { LaybyDetailsModal } from "./LaybyDetailsModal";
import { LaybyPaymentDialog } from "./LaybyPaymentDialog";
import { LaybySettingsDialog } from "./LaybySettingsDialog";

interface LaybyOrder {
  id: string;
  layby_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  total_amount: number;
  deposit_amount: number;
  balance_remaining: number;
  status: string;
  due_date: string | null;
  created_at: string;
  completion_date: string | null;
  notes: string | null;
  payment_schedule_type: string | null;
  interest_rate: number | null;
  interest_amount: number | null;
  inventory_reserved: boolean | null;
  layby_items?: LaybyItem[];
}

interface LaybyItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    sku: string;
    is_active: boolean;
  } | null;
}

interface LaybyStats {
  total: number;
  active: number;
  overdue: number;
  completed: number;
  totalValue: number;
  outstandingBalance: number;
  depositsCollected: number;
}

export function LaybyView() {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { formatCurrency } = useTax();
  const [laybyOrders, setLaybyOrders] = useState<LaybyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState<LaybyStats>({
    total: 0,
    active: 0,
    overdue: 0,
    completed: 0,
    totalValue: 0,
    outstandingBalance: 0,
    depositsCollected: 0
  });

  // Modal states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedLayby, setSelectedLayby] = useState<LaybyOrder | null>(null);

  useEffect(() => {
    if (currentStore) {
      fetchLaybyOrders();
    }
  }, [currentStore]);

  const fetchLaybyOrders = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);

      // Fetch layby orders with items
      const { data, error } = await supabase
        .from('layby_orders')
        .select(`
          *,
          layby_items (
            id,
            quantity,
            unit_price,
            total_price,
            product_id,
            products (id, name, sku, is_active)
          )
        `)
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching layby orders:', error);
        toast.error('Failed to load layby orders');
        return;
      }

      const orders = data || [];
      setLaybyOrders(orders);

      // Calculate stats
      const newStats: LaybyStats = {
        total: orders.length,
        active: orders.filter(o => o.status === 'active').length,
        overdue: orders.filter(o => o.status === 'overdue').length,
        completed: orders.filter(o => o.status === 'completed').length,
        totalValue: orders.reduce((sum, o) => sum + o.total_amount, 0),
        outstandingBalance: orders
          .filter(o => o.status === 'active' || o.status === 'overdue')
          .reduce((sum, o) => sum + o.balance_remaining, 0),
        depositsCollected: orders.reduce((sum, o) => sum + o.deposit_amount, 0)
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching layby orders:', error);
      toast.error('Failed to load layby orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary text-primary-foreground"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
      case 'completed':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'overdue':
        return <Badge className="bg-warning text-warning-foreground"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewDetails = (layby: LaybyOrder) => {
    setSelectedLayby(layby);
    setDetailsModalOpen(true);
  };

  const handleMakePayment = (layby: LaybyOrder) => {
    setSelectedLayby(layby);
    setPaymentDialogOpen(true);
  };

  const handleLaybyUpdated = () => {
    fetchLaybyOrders();
  };

  const filteredOrders = laybyOrders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.layby_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customer_phone && order.customer_phone.includes(searchTerm));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading layby orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Layby Management</h1>
          <p className="text-muted-foreground mt-1 md:mt-2">
            Manage customer layby orders and payment schedules
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setSettingsDialogOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Layby Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(stats.outstandingBalance)}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Layby Orders Table */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by customer name, layby number, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">

          {/* Layby Orders Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Layby #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || statusFilter !== "all" ? "No layby orders match your filters" : "No layby orders found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.slice(0, 10).map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleViewDetails(order)}
                    >
                      <TableCell className="font-medium text-foreground">{order.layby_number}</TableCell>
                      <TableCell className="text-foreground">{order.customer_name}</TableCell>
                      <TableCell className="text-foreground">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell className={`font-semibold ${
                        order.balance_remaining > 0 ? 'text-warning' : 'text-success'
                      }`}>
                        {formatCurrency(order.balance_remaining)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {order.due_date ? format(new Date(order.due_date), 'MMM dd, yyyy') : 'No date'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusBadge(order.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(order);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddLaybyDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onLaybyAdded={handleLaybyUpdated}
      />

      <LaybyDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        laybyOrder={selectedLayby}
        onLaybyUpdated={handleLaybyUpdated}
        onPaymentRequested={handleMakePayment}
      />

      <LaybyPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        laybyOrder={selectedLayby}
        onPaymentProcessed={handleLaybyUpdated}
      />

      <LaybySettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        onSettingsUpdated={handleLaybyUpdated}
      />
    </div>
  );
}
