import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Calendar,
  DollarSign,
  Clock,
  Pause,
  Play
} from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { SecureAction, SecureButton } from "@/components/auth/SecureAction";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTax } from "@/hooks/useTax";
import { RecurringExpenseDialog } from "./RecurringExpenseDialog";
import { ExpenseCategory } from "./types";

interface RecurringExpense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  payment_method: string;
  vendor_name: string | null;
  vendor_contact: string | null;
  is_active: boolean;
  auto_create: boolean;
  notes: string | null;
  created_at: string;
  expense_categories?: {
    name: string;
    color: string;
  } | null;
}

interface RecurringExpensesViewProps {
  categories: ExpenseCategory[];
  onExpenseAdded: () => void;
}

export function RecurringExpensesView({ categories, onExpenseAdded }: RecurringExpensesViewProps) {
  const currentStore = useCurrentStore();
  const _user = useUser();
  const { formatCurrency } = useTax();
  const [loading, setLoading] = useState(true);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (currentStore) {
      fetchRecurringExpenses();
    }
  }, [currentStore]);

  const fetchRecurringExpenses = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select(`
          *,
          expense_categories (name, color)
        `)
        .eq('store_id', currentStore.id)
        .order('next_due_date', { ascending: true });

      if (error) throw error;

      setRecurringExpenses(data || []);
    } catch (error) {
      console.error('Error fetching recurring expenses:', error);
      toast.error('Failed to load recurring expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_active: !expense.is_active })
        .eq('id', expense.id);

      if (error) throw error;

      toast.success(`Recurring expense ${expense.is_active ? 'paused' : 'activated'}`);
      fetchRecurringExpenses();
    } catch (error) {
      console.error('Error updating recurring expense:', error);
      toast.error('Failed to update recurring expense');
    }
  };

  const handleDelete = async (expense: RecurringExpense) => {
    if (!confirm(`Are you sure you want to delete "${expense.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', expense.id);

      if (error) throw error;

      toast.success('Recurring expense deleted successfully');
      fetchRecurringExpenses();
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      toast.error('Failed to delete recurring expense');
    }
  };

  const getStatusBadge = (expense: RecurringExpense) => {
    if (!expense.is_active) {
      return <Badge variant="secondary">Paused</Badge>;
    }

    const today = new Date();
    const dueDate = new Date(expense.next_due_date);
    const warningDate = addDays(today, 7); // 7 days warning

    if (isBefore(dueDate, today)) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (isBefore(dueDate, warningDate)) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Due Soon</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };

  const calculateMonthlyTotal = () => {
    return recurringExpenses
      .filter(expense => expense.is_active)
      .reduce((total, expense) => {
        let monthlyAmount = expense.amount;
        
        // Convert to monthly equivalent
        switch (expense.frequency) {
          case 'quarterly':
            monthlyAmount = expense.amount / 3;
            break;
          case 'yearly':
            monthlyAmount = expense.amount / 12;
            break;
          default:
            monthlyAmount = expense.amount;
        }
        
        return total + monthlyAmount;
      }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recurring</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recurringExpenses.filter(e => e.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {recurringExpenses.filter(e => !e.is_active).length} paused
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(calculateMonthlyTotal())}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated monthly cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recurringExpenses.filter(e => {
                const today = new Date();
                const dueDate = new Date(e.next_due_date);
                const warningDate = addDays(today, 7);
                return e.is_active && isBefore(dueDate, warningDate);
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recurring Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recurring Expenses ({recurringExpenses.length})</CardTitle>
            <SecureButton
              permission="manage_expenses"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Recurring Expense
            </SecureButton>
          </div>
        </CardHeader>
        <CardContent>
          {recurringExpenses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No recurring expenses</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add recurring expenses like rent, salaries, or subscriptions
              </p>
              <SecureButton
                permission="manage_expenses"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Recurring Expense
              </SecureButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.title}</div>
                          {expense.vendor_name && (
                            <div className="text-sm text-muted-foreground">
                              {expense.vendor_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        {getFrequencyLabel(expense.frequency)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(expense.next_due_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(expense)}
                      </TableCell>
                      <TableCell>
                        {expense.expense_categories ? (
                          <Badge variant="outline" style={{ borderColor: expense.expense_categories.color }}>
                            {expense.expense_categories.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleActive(expense)}>
                              {expense.is_active ? (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <SecureAction permission="manage_expenses">
                              <DropdownMenuItem onClick={() => handleDelete(expense)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </SecureAction>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Recurring Expense Dialog */}
      <RecurringExpenseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onExpenseAdded={() => {
          fetchRecurringExpenses();
          onExpenseAdded();
        }}
        categories={categories}
      />
    </div>
  );
}
