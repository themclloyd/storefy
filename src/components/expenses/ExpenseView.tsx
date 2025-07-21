import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  DollarSign,
  TrendingUp,
  Calendar as CalendarIcon,
  Download,
  Eye,
  Edit,
  Trash2,
  FolderOpen,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Repeat
} from "lucide-react";
import { format } from "date-fns";
import { useCurrentStore } from "@/stores/storeStore";
import { SecureButton } from "@/components/auth/SecureAction";
import { useTax } from "@/hooks/useTax";
import {
  useExpenseStore,
  useFilteredExpenses,
  useExpenseCategories,
  useExpenseStats,
  type Expense
} from "@/stores/expenseStore";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { ExpenseCategoriesView } from "./ExpenseCategoriesView";
import { ExpenseDetailsModal } from "./ExpenseDetailsModal";
import { RecurringExpensesView } from "./RecurringExpensesView";
import { PageHeader, PageLayout } from "@/components/common/PageHeader";



export function ExpenseView() {
  const currentStore = useCurrentStore();
  const { formatCurrency } = useTax();

  // Use Zustand store state
  const filteredExpenses = useFilteredExpenses();
  const categories = useExpenseCategories();
  const stats = useExpenseStats();
  const loading = useExpenseStore(state => state.loading);
  const filters = useExpenseStore(state => state.filters);
  const selectedExpense = useExpenseStore(state => state.selectedExpense);
  const currentTab = useExpenseStore(state => state.currentTab);

  // Dialog states from Zustand
  const showAddExpenseDialog = useExpenseStore(state => state.showAddExpenseDialog);
  const showEditExpenseDialog = useExpenseStore(state => state.showEditExpenseDialog);
  const showCategoriesView = useExpenseStore(state => state.showCategoriesView);
  const showExpenseDetailsModal = useExpenseStore(state => state.showExpenseDetailsModal);

  // Actions from Zustand
  const setFilters = useExpenseStore(state => state.setFilters);
  const setSelectedExpense = useExpenseStore(state => state.setSelectedExpense);
  const setShowAddExpenseDialog = useExpenseStore(state => state.setShowAddExpenseDialog);
  const setShowEditExpenseDialog = useExpenseStore(state => state.setShowEditExpenseDialog);
  const setShowCategoriesView = useExpenseStore(state => state.setShowCategoriesView);
  const setShowExpenseDetailsModal = useExpenseStore(state => state.setShowExpenseDetailsModal);
  const setCurrentTab = useExpenseStore(state => state.setCurrentTab);
  const fetchExpenses = useExpenseStore(state => state.fetchExpenses);
  const fetchCategories = useExpenseStore(state => state.fetchCategories);
  const deleteExpense = useExpenseStore(state => state.deleteExpense);
  const exportExpenses = useExpenseStore(state => state.exportExpenses);

  useEffect(() => {
    if (currentStore?.id) {
      fetchExpenses(currentStore.id);
      fetchCategories(currentStore.id);
    }
  }, [currentStore?.id, fetchExpenses, fetchCategories]);


  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowEditExpenseDialog(true);
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowExpenseDetailsModal(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!confirm(`Are you sure you want to delete expense "${expense.title}"?`)) return;

    await deleteExpense(expense.id);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      paid: { label: 'Paid', variant: 'default' as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Expense Management"
        description="Track and manage your business expenses"
        icon={<DollarSign className="w-8 h-8 text-primary" />}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setShowCategoriesView(true)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Manage Categories
            </Button>
            <Button
              variant="outline"
              onClick={exportExpenses}
              disabled={filteredExpenses.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <SecureButton
              permission="manage_expenses"
              onClick={() => setShowAddExpenseDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </SecureButton>
          </>
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="expenses" value={currentTab} onValueChange={(value) => setCurrentTab(value as "expenses" | "recurring")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="expenses">
            <Receipt className="w-4 h-4 mr-2" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <Repeat className="w-4 h-4 mr-2" />
            Recurring Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-6">
          {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyTotal)}</div>
            <p className="text-xs text-muted-foreground">Current month expenses</p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.taxDeductibleAmount)}</div>
            <p className="text-xs text-muted-foreground">Eligible for deduction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search expenses by title, number, vendor, or description..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ searchTerm: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filters.selectedCategory || "all"} onValueChange={(value) => setFilters({ selectedCategory: value === "all" ? null : value })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.selectedStatus || "all"} onValueChange={(value) => setFilters({ selectedStatus: value === "all" ? null : value })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                          {format(filters.dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange.from}
                    selected={filters.dateRange}
                    onSelect={(range) => setFilters({ dateRange: { from: range?.from, to: range?.to } })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Expenses Table */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle>Expenses ({filteredExpenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No expenses found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filters.searchTerm || filters.selectedCategory || filters.selectedStatus || filters.dateRange.from
                  ? "Try adjusting your filters"
                  : "Get started by adding your first expense"}
              </p>
              {!filters.searchTerm && !filters.selectedCategory && !filters.selectedStatus && !filters.dateRange.from && (
                <SecureButton
                  permission="manage_expenses"
                  onClick={() => setShowAddExpenseDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Expense
                </SecureButton>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.expense_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.title}</div>
                          {expense.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {expense.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {expense.expense_categories ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: expense.expense_categories.color }}
                            />
                            <span className="text-sm">{expense.expense_categories.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Uncategorized</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>{format(new Date(expense.expense_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>{expense.vendor_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewExpense(expense)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <SecureButton
                            permission="manage_expenses"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Edit className="w-4 h-4" />
                          </SecureButton>
                          <SecureButton
                            permission="manage_expenses"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </SecureButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringExpensesView
            categories={categories.map(cat => ({ ...cat, description: cat.description || undefined }))}
            onExpenseAdded={() => currentStore?.id && fetchExpenses(currentStore.id)}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddExpenseDialog
        open={showAddExpenseDialog}
        onOpenChange={setShowAddExpenseDialog}
        onExpenseAdded={() => currentStore?.id && fetchExpenses(currentStore.id)}
        categories={categories.map(cat => ({ ...cat, description: cat.description || '' }))}
      />

      <EditExpenseDialog
        open={showEditExpenseDialog}
        onOpenChange={setShowEditExpenseDialog}
        expense={selectedExpense ? {
          ...selectedExpense,
          description: selectedExpense.description || '',
          vendor_name: selectedExpense.vendor_name || '',
          vendor_contact: selectedExpense.vendor_contact || '',
          receipt_number: selectedExpense.receipt_number || '',
          notes: selectedExpense.notes || '',
          category_id: selectedExpense.category_id || undefined,
          expense_categories: selectedExpense.expense_categories || undefined
        } : null}
        onExpenseUpdated={() => currentStore?.id && fetchExpenses(currentStore.id)}
        categories={categories.map(cat => ({ ...cat, description: cat.description || '' }))}
      />

      <ExpenseCategoriesView
        open={showCategoriesView}
        onOpenChange={setShowCategoriesView}
        onCategoriesUpdated={() => currentStore?.id && fetchCategories(currentStore.id)}
      />

      <ExpenseDetailsModal
        open={showExpenseDetailsModal}
        onOpenChange={setShowExpenseDetailsModal}
        expense={selectedExpense ? {
          ...selectedExpense,
          description: selectedExpense.description || '',
          vendor_name: selectedExpense.vendor_name || '',
          vendor_contact: selectedExpense.vendor_contact || '',
          receipt_number: selectedExpense.receipt_number || '',
          notes: selectedExpense.notes || '',
          expense_categories: selectedExpense.expense_categories || undefined
        } : null}
      />
    </PageLayout>
  );
}
