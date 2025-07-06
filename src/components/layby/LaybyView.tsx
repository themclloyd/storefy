import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Clock, DollarSign, Users, Calendar, Eye, CreditCard } from "lucide-react";
import { CreateLaybyDialog } from "./CreateLaybyDialog";
import { LaybyDetailsDialog } from "./LaybyDetailsDialog";
import { LaybyPaymentDialog } from "./LaybyPaymentDialog";

interface LaybyOrder {
  id: string;
  layby_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  deposit_amount: number;
  balance_remaining: number;
  status: 'active' | 'completed' | 'cancelled' | 'overdue';
  due_date: string;
  completion_date: string;
  created_at: string;
  layby_items?: LaybyItem[];
  layby_payments?: LaybyPayment[];
}

interface LaybyItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    sku: string;
  };
}

interface LaybyPayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  notes: string;
  created_at: string;
}

export function LaybyView() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [laybyOrders, setLaybyOrders] = useState<LaybyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedLayby, setSelectedLayby] = useState<LaybyOrder | null>(null);

  useEffect(() => {
    if (currentStore) {
      fetchLaybyOrders();
    }
  }, [currentStore]);

  const fetchLaybyOrders = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('layby_orders')
        .select(`
          *,
          layby_items (
            *,
            products (name, sku)
          ),
          layby_payments (*)
        `)
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching layby orders:', error);
        toast.error('Failed to load layby orders');
        return;
      }

      setLaybyOrders(data || []);
    } catch (error) {
      console.error('Error fetching layby orders:', error);
      toast.error('Failed to load layby orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredLaybyOrders = laybyOrders.filter(layby => {
    const matchesSearch = layby.layby_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         layby.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         layby.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || layby.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", variant: "default" as const },
      completed: { label: "Completed", variant: "secondary" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
      overdue: { label: "Overdue", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewDetails = (layby: LaybyOrder) => {
    setSelectedLayby(layby);
    setShowDetailsDialog(true);
  };

  const handleMakePayment = (layby: LaybyOrder) => {
    setSelectedLayby(layby);
    setShowPaymentDialog(true);
  };

  const totalLaybys = laybyOrders.length;
  const activeLaybys = laybyOrders.filter(l => l.status === 'active').length;
  const totalValue = laybyOrders.reduce((sum, l) => sum + l.total_amount, 0);
  const outstandingBalance = laybyOrders
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + l.balance_remaining, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading layby orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Layby Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage layby orders and payment schedules
          </p>
        </div>
        <Button
          className="bg-gradient-primary text-white"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Layby
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Laybys
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalLaybys}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Laybys
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeLaybys}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${outstandingBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by layby number, customer name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === "overdue" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("overdue")}
              >
                Overdue
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Layby Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLaybyOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {laybyOrders.length === 0 ? "No layby orders found. Create your first layby to get started." : "No layby orders match your search criteria."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLaybyOrders.map((layby) => (
                    <TableRow key={layby.id}>
                      <TableCell className="font-medium">{layby.layby_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{layby.customer_name}</div>
                          {layby.customer_phone && (
                            <div className="text-sm text-muted-foreground">{layby.customer_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${layby.total_amount.toFixed(2)}</TableCell>
                      <TableCell>${layby.balance_remaining.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(layby.status)}</TableCell>
                      <TableCell>
                        {layby.due_date ? new Date(layby.due_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(layby)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {layby.status === 'active' && layby.balance_remaining > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMakePayment(layby)}
                            >
                              <CreditCard className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateLaybyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchLaybyOrders}
      />

      {selectedLayby && (
        <>
          <LaybyDetailsDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            layby={selectedLayby}
            onUpdate={fetchLaybyOrders}
          />

          <LaybyPaymentDialog
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            layby={selectedLayby}
            onSuccess={fetchLaybyOrders}
          />
        </>
      )}
    </div>
  );
}
