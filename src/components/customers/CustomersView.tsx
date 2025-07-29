import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Users, Phone, Mail, Edit, Eye, Loader2, Download, BarChart3, MoreVertical, Filter, Grid3X3, List, Search } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { useTax } from "@/hooks/useTax";
import {
  useCustomerStore,
  useCustomers,
  useFilteredCustomers,
  type Customer
} from "@/stores/customerStore";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { EditCustomerDialog } from "./EditCustomerDialog";
import { CustomerDetailsModal } from "./CustomerDetailsModal";
import { CustomerExportDialog } from "./CustomerExportDialog";
import { CustomerStatusDialog } from "./CustomerStatusDialog";
import { CustomerAnalytics } from "./CustomerAnalytics";
import { CustomerFilters } from "./CustomerFilters";
import { PageHeader, PageLayout } from "@/components/common/PageHeader";



export function CustomersView() {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { from, currentStoreId, isPinSession } = useSupabaseClient();
  const { formatCurrency } = useTax();

  // Use Zustand store state
  const customers = useCustomers();
  const filteredCustomers = useFilteredCustomers();
  const loading = useCustomerStore(state => state.loading);
  const selectedCustomer = useCustomerStore(state => state.selectedCustomer);
  const viewMode = useCustomerStore(state => state.viewMode);

  // Dialog states from Zustand
  const showAddDialog = useCustomerStore(state => state.showAddDialog);
  const showEditDialog = useCustomerStore(state => state.showEditDialog);
  const showDetailsModal = useCustomerStore(state => state.showDetailsModal);
  const showExportDialog = useCustomerStore(state => state.showExportDialog);
  const showStatusDialog = useCustomerStore(state => state.showStatusDialog);
  const showAnalytics = useCustomerStore(state => state.showAnalytics);

  // Actions from Zustand
  const setSelectedCustomer = useCustomerStore(state => state.setSelectedCustomer);
  const setViewMode = useCustomerStore(state => state.setViewMode);
  const setShowAddDialog = useCustomerStore(state => state.setShowAddDialog);
  const setShowEditDialog = useCustomerStore(state => state.setShowEditDialog);
  const setShowDetailsModal = useCustomerStore(state => state.setShowDetailsModal);
  const setShowExportDialog = useCustomerStore(state => state.setShowExportDialog);
  const setShowStatusDialog = useCustomerStore(state => state.setShowStatusDialog);
  const setShowAnalytics = useCustomerStore(state => state.setShowAnalytics);
  const fetchCustomers = useCustomerStore(state => state.fetchCustomers);

  // Mobile-specific states (keep local as they're UI-specific)
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);



  useEffect(() => {
    const storeId = currentStoreId || currentStore?.id;
    if (storeId && ((currentStore && user) || (currentStoreId && isPinSession))) {
      fetchCustomers(storeId);
    }
  }, [currentStore, user, currentStoreId, isPinSession, fetchCustomers]);



  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditDialog(true);
  };

  const handleCustomerUpdated = () => {
    const storeId = currentStoreId || currentStore?.id;
    if (storeId) {
      fetchCustomers(storeId);
    }
  };

  const handleStatusChange = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowStatusDialog(true);
  };

  // Remove the old filtering logic since it's now handled by CustomerFilters component

  const totalCustomers = filteredCustomers.length;
  const activeCustomers = filteredCustomers.filter(c => c.status === 'active').length;
  const vipCustomers = filteredCustomers.filter(c => c.status === 'vip').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading customers...</span>
      </div>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Customers"
        description={`${filteredCustomers.length} customers`}
        icon={<Users className="w-8 h-8 text-primary" />}
        actions={
          <>
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Filters */}
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden">
                  <Filter className="w-4 h-4" />
                </Button>
              </SheetTrigger>
            </Sheet>

            {/* Mobile Actions Menu */}
            <Sheet open={showMobileActions} onOpenChange={setShowMobileActions}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </SheetTrigger>
            </Sheet>

            {/* Desktop Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              disabled={customers.length === 0}
              className="hidden sm:flex"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">{showAnalytics ? 'Hide' : 'Show'} Analytics</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              disabled={customers.length === 0}
              className="hidden sm:flex"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Export</span>
            </Button>

            {/* Add Customer Button */}
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="hidden sm:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Add Customer</span>
            </Button>
          </>
        }
      />

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-foreground">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Customers
            </p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-success">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Active
            </p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              VIP
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-warning">{vipCustomers}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              VIP Status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <CustomerFilters />

      {/* Customers Table */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="text-foreground">Customer Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          {viewMode === 'cards' && (
            <div className="p-3 sm:p-6 space-y-3">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {customers.length === 0 ? "No customers found. Add your first customer to get started." : "No customers match your filter criteria."}
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="border border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
                          <div className="flex flex-col gap-1 mt-1">
                            {customer.email && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={
                            customer.status === 'vip' ? 'default' :
                            customer.status === 'active' ? 'secondary' : 'outline'
                          }
                          className="cursor-pointer ml-2"
                          onClick={() => handleStatusChange(customer)}
                        >
                          {(customer.status || 'active').toUpperCase()}
                        </Badge>
                      </div>

                      {/* Customer Stats */}
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Orders:</span>
                          <p className="font-medium">{customer.total_orders || 0}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Spent:</span>
                          <p className="font-medium text-success">{formatCurrency(customer.total_spent || 0)}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Last Order:</span>
                          <p className="font-medium">
                            {customer.last_order_date
                              ? new Date(customer.last_order_date).toLocaleDateString()
                              : 'No orders yet'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCustomer(customer)}
                          className="flex-1"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCustomer(customer)}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Desktop Table View */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {customers.length === 0 ? "No customers found. Add your first customer to get started." : "No customers match your filter criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{customer.name}</div>
                        {customer.email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{customer.total_orders || 0}</TableCell>
                    <TableCell className="font-medium text-success">
                      {formatCurrency(customer.total_spent || 0)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.last_order_date
                        ? new Date(customer.last_order_date).toLocaleDateString()
                        : 'No orders yet'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.status === 'vip' ? 'default' :
                          customer.status === 'active' ? 'secondary' : 'outline'
                        }
                        className={
                          customer.status === 'vip' ? 'bg-warning text-warning-foreground cursor-pointer hover:bg-warning/80' :
                          customer.status === 'active' ? 'bg-success/10 text-success cursor-pointer hover:bg-success/20' :
                          'text-muted-foreground cursor-pointer hover:bg-muted'
                        }
                        onClick={() => handleStatusChange(customer)}
                      >
                        {(customer.status || 'active').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCustomer(customer)}
                          title="View customer details"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCustomer(customer)}
                          title={`Edit customer${(customer.total_orders || 0) === 0 ? ' (can be deleted)' : ''}`}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Section */}
      {showAnalytics && customers.length > 0 && (
        <CustomerAnalytics customers={customers} />
      )}

      {/* Dialogs and Modals */}
      <AddCustomerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onCustomerAdded={handleCustomerUpdated}
      />

      <EditCustomerDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        customer={selectedCustomer}
        onCustomerUpdated={handleCustomerUpdated}
        onCustomerDeleted={handleCustomerUpdated}
      />

      <CustomerDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        customer={selectedCustomer}
        onEditCustomer={handleEditCustomer}
      />

      <CustomerExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        customers={filteredCustomers}
      />

      <CustomerStatusDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        customer={selectedCustomer}
        onStatusUpdated={handleCustomerUpdated}
      />

      {/* Mobile Filters Sheet */}
      <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
        <SheetContent side="right" className="w-full sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Filters & Search</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Customers</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="vip">VIP</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Order Count Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Order History</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                <option value="all">All Customers</option>
                <option value="with-orders">With Orders</option>
                <option value="no-orders">No Orders</option>
                <option value="frequent">Frequent Buyers (5+)</option>
              </select>
            </div>

            <Button
              onClick={() => setShowMobileFilters(false)}
              variant="outline"
              className="w-full"
            >
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Actions Sheet */}
      <Sheet open={showMobileActions} onOpenChange={setShowMobileActions}>
        <SheetContent side="right" className="w-full sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Actions</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            <Button
              onClick={() => {
                setShowAddDialog(true);
                setShowMobileActions(false);
              }}
              className="w-full justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowAnalytics(!showAnalytics);
                setShowMobileActions(false);
              }}
              disabled={customers.length === 0}
              className="w-full justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowExportDialog(true);
                setShowMobileActions(false);
              }}
              disabled={customers.length === 0}
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Add Button for Mobile */}
      <div className="sm:hidden fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setShowAddDialog(true)}
          className="h-14 w-14 rounded-full shadow-lg"
          size="sm"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </PageLayout>
  );
}