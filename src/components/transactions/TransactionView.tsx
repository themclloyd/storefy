import { useEffect } from "react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { useTax } from "@/hooks/useTax";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import {
  useTransactionStore,
  useTransactions,
  useFilteredTransactions,
  type Transaction
} from "@/stores/transactionStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Receipt, DollarSign, TrendingUp, Calendar as CalendarIcon, Download, Filter, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { PageHeader, PageLayout } from "@/components/common/PageHeader";
import { ErrorBoundary } from "../ErrorBoundary";



export function TransactionView() {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { formatCurrency } = useTax();
  const { getPaymentOptions, getPaymentMethodDisplay, getPaymentMethodBadgeVariant } = usePaymentMethods();

  // Use Zustand store state
  const transactions = useTransactions();
  const filteredTransactions = useFilteredTransactions();
  const loading = useTransactionStore(state => state.loading);
  const filters = useTransactionStore(state => state.filters);
  const selectedTransaction = useTransactionStore(state => state.selectedTransaction);
  const showTransactionDetails = useTransactionStore(state => state.showTransactionDetails);
  const todayRevenue = useTransactionStore(state => state.todayRevenue);
  const totalTransactions = useTransactionStore(state => state.totalTransactions);

  // Actions from Zustand
  const setFilters = useTransactionStore(state => state.setFilters);
  const resetFilters = useTransactionStore(state => state.resetFilters);
  const setSelectedTransaction = useTransactionStore(state => state.setSelectedTransaction);
  const setShowTransactionDetails = useTransactionStore(state => state.setShowTransactionDetails);
  const fetchTransactions = useTransactionStore(state => state.fetchTransactions);


  useEffect(() => {
    if (currentStore?.id) {
      fetchTransactions(currentStore.id);
    }
  }, [currentStore?.id, fetchTransactions]);



  const getTransactionTypeBadge = (type: string) => {
    const typeConfig = {
      sale: { label: "Sale", variant: "default" as const },
      layby_payment: { label: "Layby Payment", variant: "secondary" as const },
      layby_deposit: { label: "Layby Deposit", variant: "secondary" as const },
      refund: { label: "Refund", variant: "destructive" as const },
      adjustment: { label: "Adjustment", variant: "outline" as const },
      other: { label: "Other", variant: "outline" as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodBadge = (method: string) => {
    const label = getPaymentMethodDisplay(method);
    const variant = getPaymentMethodBadgeVariant(method);
    return <Badge variant={variant}>{label}</Badge>;
  };

  // Calculate additional statistics (totalTransactions and todayRevenue come from store)
  const totalRevenue = filteredTransactions
    .filter(t => ['sale', 'layby_payment', 'layby_deposit'].includes(t.transaction_type))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRefunds = filteredTransactions
    .filter(t => t.transaction_type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);
  const netRevenue = totalRevenue - totalRefunds;



  const clearFilters = () => {
    resetFilters();
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };



  const exportTransactions = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const csvContent = [
      ['Transaction Number', 'Date', 'Type', 'Customer', 'Description', 'Payment Method', 'Amount'].join(','),
      ...filteredTransactions.map(transaction => [
        transaction.transaction_number,
        new Date(transaction.created_at).toLocaleDateString(),
        transaction.transaction_type.replace('_', ' '),
        transaction.customer_name || 'N/A',
        `"${transaction.description || ''}"`,
        transaction.payment_method.replace('_', ' '),
        transaction.amount.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Transactions exported successfully');
  };

  if (loading || !currentStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {!currentStore ? 'Please select a store...' : 'Loading transactions...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <PageLayout>
        <PageHeader
          title="Transactions"
          description="View and manage all store transactions"
          icon={<Receipt className="w-8 h-8 text-primary" />}
          actions={
            <Button variant="outline" onClick={exportTransactions} disabled={filteredTransactions.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          }
        />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalTransactions}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${netRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Revenue
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${todayRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>



      {/* Summary Report */}
      {(filters.dateFrom || filters.dateTo || filters.typeFilter !== "all" || filters.paymentMethodFilter !== "all") && (
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="text-lg">Filtered Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Filtered Transactions</div>
                <div className="text-xl font-bold text-blue-600">{filteredTransactions.length}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(filteredTransactions
                    .filter(t => ['sale', 'layby_payment', 'layby_deposit'].includes(t.transaction_type))
                    .reduce((sum, t) => sum + t.amount, 0))}
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Refunds</div>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(filteredTransactions
                    .filter(t => t.transaction_type === 'refund')
                    .reduce((sum, t) => sum + t.amount, 0))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by transaction number, customer, or description..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ searchTerm: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={filters.typeFilter} onValueChange={(value) => setFilters({ typeFilter: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="layby_payment">Layby Payment</SelectItem>
                  <SelectItem value="layby_deposit">Layby Deposit</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.paymentMethodFilter} onValueChange={(value) => setFilters({ paymentMethodFilter: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4" />
                      <span>All Methods</span>
                    </div>
                  </SelectItem>
                  {getPaymentOptions().map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        {option.type === 'cash' ? (
                          <DollarSign className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <div className="flex flex-col items-start">
                          <span>{option.name}</span>
                          {option.provider && (
                            <span className="text-xs text-muted-foreground">{option.provider}</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "MMM dd") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => setFilters({ dateFrom: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "MMM dd") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => setFilters({ dateTo: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={clearFilters}>
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {transactions.length === 0 ? "No transactions found." : "No transactions match your search criteria."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        <TableCell className="font-medium">{transaction.transaction_number}</TableCell>
                        <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{getTransactionTypeBadge(transaction.transaction_type)}</TableCell>
                        <TableCell>{transaction.customer_name || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                        <TableCell>{getPaymentMethodBadge(transaction.payment_method)}</TableCell>
                        <TableCell className={`font-semibold ${
                          transaction.transaction_type === 'refund' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.transaction_type === 'refund' ? '-' : ''}{formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
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

            {/* Transaction Details Modal */}
            {selectedTransaction && (
              <TransactionDetailsModal
                transaction={selectedTransaction}
                open={showTransactionDetails}
                onOpenChange={setShowTransactionDetails}
                onTransactionUpdate={() => currentStore?.id && fetchTransactions(currentStore.id)}
              />
            )}

      </PageLayout>
    </ErrorBoundary>
  );
}
