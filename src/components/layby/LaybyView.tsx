import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Plus,
  Search,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Eye,
  CreditCard,
  Filter,
  MoreHorizontal,
  Download,
  Mail,
  Bell,
  Trash2,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Settings
} from "lucide-react";
import { CreateLaybyDialog } from "./CreateLaybyDialog";
import { LaybyDetailsDialog } from "./LaybyDetailsDialog";
import { LaybyPaymentDialog } from "./LaybyPaymentDialog";
import { LaybyBulkActionsDialog } from "./LaybyBulkActionsDialog";
import { LaybyReportsDialog } from "./LaybyReportsDialog";
import { LaybyNotificationDialog } from "./LaybyNotificationDialog";
import { LaybySettingsDialog } from "./LaybySettingsDialog";
import { LaybyCalendarView } from "./LaybyCalendarView";
import { LaybyInterestCalculator } from "./LaybyInterestCalculator";
import { DateRange } from "react-day-picker";

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
  priority_level?: 'low' | 'normal' | 'high' | 'urgent';
  payment_schedule_type?: 'custom' | 'weekly' | 'bi_weekly' | 'monthly';
  interest_rate?: number;
  interest_amount?: number;
  last_reminder_sent?: string;
  reminder_count?: number;
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
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [amountRangeFilter, setAmountRangeFilter] = useState({ min: "", max: "" });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedLaybys, setSelectedLaybys] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showBulkActionsDialog, setShowBulkActionsDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showInterestCalculator, setShowInterestCalculator] = useState(false);
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
    // Search filter
    const matchesSearch = searchTerm === "" ||
      layby.layby_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      layby.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      layby.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      layby.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "all" || layby.status === statusFilter;

    // Priority filter
    const matchesPriority = priorityFilter === "all" || layby.priority_level === priorityFilter;

    // Amount range filter
    const matchesAmountRange =
      (amountRangeFilter.min === "" || layby.total_amount >= parseFloat(amountRangeFilter.min)) &&
      (amountRangeFilter.max === "" || layby.total_amount <= parseFloat(amountRangeFilter.max));

    // Date range filter
    const matchesDateRange = !dateRange || !dateRange.from ||
      (new Date(layby.created_at) >= dateRange.from &&
       (!dateRange.to || new Date(layby.created_at) <= dateRange.to));

    return matchesSearch && matchesStatus && matchesPriority && matchesAmountRange && matchesDateRange;
  }).sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case "layby_number":
        aValue = a.layby_number;
        bValue = b.layby_number;
        break;
      case "customer_name":
        aValue = a.customer_name;
        bValue = b.customer_name;
        break;
      case "total_amount":
        aValue = a.total_amount;
        bValue = b.total_amount;
        break;
      case "balance_remaining":
        aValue = a.balance_remaining;
        bValue = b.balance_remaining;
        break;
      case "due_date":
        aValue = a.due_date ? new Date(a.due_date) : new Date(0);
        bValue = b.due_date ? new Date(b.due_date) : new Date(0);
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
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

  const handleSelectLayby = (laybyId: string, checked: boolean) => {
    if (checked) {
      setSelectedLaybys(prev => [...prev, laybyId]);
    } else {
      setSelectedLaybys(prev => prev.filter(id => id !== laybyId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLaybys(filteredLaybyOrders.map(layby => layby.id));
    } else {
      setSelectedLaybys([]);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedLaybys.length === 0) {
      toast.error("Please select at least one layby order");
      return;
    }
    setShowBulkActionsDialog(true);
  };

  const handleSendReminder = async (layby: LaybyOrder) => {
    try {
      // This would integrate with email/SMS service
      toast.success(`Reminder sent to ${layby.customer_name}`);
      fetchLaybyOrders();
    } catch (error) {
      toast.error("Failed to send reminder");
    }
  };

  const handleExportData = () => {
    const csvData = filteredLaybyOrders.map(layby => ({
      'Layby Number': layby.layby_number,
      'Customer Name': layby.customer_name,
      'Customer Phone': layby.customer_phone || '',
      'Customer Email': layby.customer_email || '',
      'Total Amount': layby.total_amount,
      'Deposit Amount': layby.deposit_amount,
      'Balance Remaining': layby.balance_remaining,
      'Status': layby.status,
      'Due Date': layby.due_date || '',
      'Created Date': new Date(layby.created_at).toLocaleDateString(),
      'Priority': layby.priority_level || 'normal'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layby-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAmountRangeFilter({ min: "", max: "" });
    setDateRange(undefined);
    setSortBy("created_at");
    setSortOrder("desc");
  };

  const totalLaybys = laybyOrders.length;
  const activeLaybys = laybyOrders.filter(l => l.status === 'active').length;
  const completedLaybys = laybyOrders.filter(l => l.status === 'completed').length;
  const overdueLaybys = laybyOrders.filter(l => l.status === 'overdue').length;
  const totalValue = laybyOrders.reduce((sum, l) => sum + l.total_amount, 0);
  const outstandingBalance = laybyOrders
    .filter(l => l.status === 'active' || l.status === 'overdue')
    .reduce((sum, l) => sum + l.balance_remaining, 0);
  const totalDeposits = laybyOrders.reduce((sum, l) => sum + l.deposit_amount, 0);
  const averageOrderValue = totalLaybys > 0 ? totalValue / totalLaybys : 0;
  const completionRate = totalLaybys > 0 ? (completedLaybys / totalLaybys) * 100 : 0;

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
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCalendarView(true)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowInterestCalculator(true)}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Interest
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowReportsDialog(true)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={filteredLaybyOrders.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {selectedLaybys.length > 0 && (
            <Button
              variant="outline"
              onClick={() => handleBulkAction('bulk')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Bulk Actions ({selectedLaybys.length})
            </Button>
          )}
          <Button
            className="bg-gradient-primary text-white"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Layby
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">{totalLaybys}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{activeLaybys}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{completedLaybys}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{overdueLaybys}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">
              ${totalValue.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">
              ${outstandingBalance.toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="card-professional">
        <CardHeader>
          <div className="space-y-4">
            {/* Primary Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by layby number, customer name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showAdvancedFilters ? "Hide" : "Show"} Filters
                </Button>

                {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" ||
                  amountRangeFilter.min || amountRangeFilter.max || dateRange) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All ({laybyOrders.length})
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active ({laybyOrders.filter(l => l.status === 'active').length})
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
              >
                Completed ({laybyOrders.filter(l => l.status === 'completed').length})
              </Button>
              <Button
                variant={statusFilter === "overdue" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("overdue")}
              >
                Overdue ({laybyOrders.filter(l => l.status === 'overdue').length})
              </Button>
              <Button
                variant={statusFilter === "cancelled" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("cancelled")}
              >
                Cancelled ({laybyOrders.filter(l => l.status === 'cancelled').length})
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount Range</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={amountRangeFilter.min}
                      onChange={(e) => setAmountRangeFilter(prev => ({ ...prev, min: e.target.value }))}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={amountRangeFilter.max}
                      onChange={(e) => setAmountRangeFilter(prev => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Created Date</SelectItem>
                        <SelectItem value="layby_number">Layby Number</SelectItem>
                        <SelectItem value="customer_name">Customer Name</SelectItem>
                        <SelectItem value="total_amount">Total Amount</SelectItem>
                        <SelectItem value="balance_remaining">Balance</SelectItem>
                        <SelectItem value="due_date">Due Date</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLaybys.length === filteredLaybyOrders.length && filteredLaybyOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Layby Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLaybyOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {laybyOrders.length === 0 ? "No layby orders found. Create your first layby to get started." : "No layby orders match your search criteria."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLaybyOrders.map((layby) => (
                    <TableRow key={layby.id} className={selectedLaybys.includes(layby.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLaybys.includes(layby.id)}
                          onCheckedChange={(checked) => handleSelectLayby(layby.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{layby.layby_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{layby.customer_name}</div>
                          {layby.customer_phone && (
                            <div className="text-sm text-muted-foreground">{layby.customer_phone}</div>
                          )}
                          {layby.customer_email && (
                            <div className="text-sm text-muted-foreground">{layby.customer_email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${layby.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="font-medium">${layby.balance_remaining.toFixed(2)}</div>
                        {layby.balance_remaining > 0 && layby.total_amount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {((layby.total_amount - layby.balance_remaining) / layby.total_amount * 100).toFixed(0)}% paid
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(layby.status)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          layby.priority_level === 'urgent' ? 'destructive' :
                          layby.priority_level === 'high' ? 'default' :
                          layby.priority_level === 'low' ? 'secondary' : 'outline'
                        }>
                          {layby.priority_level || 'normal'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          {layby.due_date ? new Date(layby.due_date).toLocaleDateString() : 'N/A'}
                          {layby.due_date && new Date(layby.due_date) < new Date() && layby.status === 'active' && (
                            <div className="text-xs text-red-600">Overdue</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedLayby(layby);
                                setShowNotificationDialog(true);
                              }}>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Notification
                              </DropdownMenuItem>
                              {layby.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleSendReminder(layby)}>
                                  <Bell className="w-4 h-4 mr-2" />
                                  Send Reminder
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  const csv = `Layby Number,Customer,Total,Balance,Status,Due Date\n${layby.layby_number},${layby.customer_name},${layby.total_amount},${layby.balance_remaining},${layby.status},${layby.due_date || ''}`;
                                  const blob = new Blob([csv], { type: 'text/csv' });
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `layby-${layby.layby_number}.csv`;
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Export Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <LaybyBulkActionsDialog
        open={showBulkActionsDialog}
        onOpenChange={setShowBulkActionsDialog}
        selectedLaybyIds={selectedLaybys}
        laybyOrders={laybyOrders}
        onSuccess={() => {
          fetchLaybyOrders();
          setSelectedLaybys([]);
        }}
      />

      <LaybyReportsDialog
        open={showReportsDialog}
        onOpenChange={setShowReportsDialog}
      />

      <LaybyNotificationDialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
        layby={selectedLayby}
        onSuccess={fetchLaybyOrders}
      />

      <LaybySettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />

      <LaybyCalendarView
        open={showCalendarView}
        onOpenChange={setShowCalendarView}
      />

      <LaybyInterestCalculator
        open={showInterestCalculator}
        onOpenChange={setShowInterestCalculator}
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
