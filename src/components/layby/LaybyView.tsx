import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Search, DollarSign, Calendar, User, Package, AlertCircle, CheckCircle, XCircle, CreditCard, History, Settings, Eye } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { useTax } from "@/hooks/useTax";
import { format } from "date-fns";
import {
  useLaybyStore,
  useLaybyOrders,
  useFilteredLaybyOrders,
  useLaybyStats,
  type LaybyOrder
} from "@/stores/laybyStore";
import { AddLaybyDialog } from "./AddLaybyDialog";
import { LaybyDetailsModal } from "./LaybyDetailsModal";
import { LaybyPaymentDialog } from "./LaybyPaymentDialog";
import { LaybySettingsDialog } from "./LaybySettingsDialog";
import { PageHeader, PageLayout } from "@/components/common/PageHeader";



export function LaybyView() {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { formatCurrency } = useTax();

  // Use Zustand store state
  const laybyOrders = useLaybyOrders();
  const filteredOrders = useFilteredLaybyOrders();
  const stats = useLaybyStats();
  const loading = useLaybyStore(state => state.loading);
  const filters = useLaybyStore(state => state.filters);
  const selectedLayby = useLaybyStore(state => state.selectedLayby);

  // Dialog states from Zustand
  const showAddDialog = useLaybyStore(state => state.showAddDialog);
  const showDetailsModal = useLaybyStore(state => state.showDetailsModal);
  const showPaymentDialog = useLaybyStore(state => state.showPaymentDialog);
  const showSettingsDialog = useLaybyStore(state => state.showSettingsDialog);

  // Actions from Zustand
  const setFilters = useLaybyStore(state => state.setFilters);
  const setSelectedLayby = useLaybyStore(state => state.setSelectedLayby);
  const setShowAddDialog = useLaybyStore(state => state.setShowAddDialog);
  const setShowDetailsModal = useLaybyStore(state => state.setShowDetailsModal);
  const setShowPaymentDialog = useLaybyStore(state => state.setShowPaymentDialog);
  const setShowSettingsDialog = useLaybyStore(state => state.setShowSettingsDialog);
  const fetchLaybyOrders = useLaybyStore(state => state.fetchLaybyOrders);

  useEffect(() => {
    if (currentStore?.id) {
      fetchLaybyOrders(currentStore.id);
    }
  }, [currentStore?.id, fetchLaybyOrders]);

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
    setShowDetailsModal(true);
  };

  const handleMakePayment = (layby: LaybyOrder) => {
    setSelectedLayby(layby);
    setShowPaymentDialog(true);
  };

  const handleLaybyUpdated = () => {
    if (currentStore?.id) {
      fetchLaybyOrders(currentStore.id);
    }
  };



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
    <PageLayout>
      <PageHeader
        title="Layby Management"
        description="Manage customer layby orders and payment schedules"
        icon={<Clock className="w-8 h-8 text-primary" />}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Layby Order
            </Button>
          </>
        }
      />

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
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ searchTerm: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={filters.statusFilter} onValueChange={(value) => setFilters({ statusFilter: value })}>
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
                      {filters.searchTerm || filters.statusFilter !== "all" ? "No layby orders match your filters" : "No layby orders found"}
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
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onLaybyAdded={handleLaybyUpdated}
      />

      <LaybyDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        laybyOrder={selectedLayby}
        onLaybyUpdated={handleLaybyUpdated}
        onPaymentRequested={handleMakePayment}
      />

      <LaybyPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        laybyOrder={selectedLayby}
        onPaymentProcessed={handleLaybyUpdated}
      />

      <LaybySettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        onSettingsUpdated={handleLaybyUpdated}
      />
    </PageLayout>
  );
}
