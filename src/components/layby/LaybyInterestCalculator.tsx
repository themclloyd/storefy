import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, DollarSign, Calendar, AlertTriangle } from "lucide-react";

interface LaybyInterestCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface OverdueLayby {
  id: string;
  layby_number: string;
  customer_name: string;
  balance_remaining: number;
  due_date: string;
  interest_rate: number;
  interest_amount: number;
  days_overdue: number;
  calculated_interest: number;
}

export function LaybyInterestCalculator({ open, onOpenChange, onSuccess }: LaybyInterestCalculatorProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [overdueLaybys, setOverdueLaybys] = useState<OverdueLayby[]>([]);
  const [selectedLaybys, setSelectedLaybys] = useState<string[]>([]);

  useEffect(() => {
    if (open && currentStore) {
      fetchOverdueLaybys();
    }
  }, [open, currentStore]);

  const fetchOverdueLaybys = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      const { data: laybyOrders, error } = await supabase
        .from('layby_orders')
        .select('*')
        .eq('store_id', currentStore.id)
        .eq('status', 'overdue')
        .gt('balance_remaining', 0)
        .gt('interest_rate', 0);

      if (error) {
        throw error;
      }

      const overdueData: OverdueLayby[] = [];

      for (const layby of laybyOrders || []) {
        const dueDate = new Date(layby.due_date);
        const today = new Date();
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        if (daysOverdue > 0) {
          // Calculate interest using the database function
          const { data: calculatedInterest, error: interestError } = await supabase
            .rpc('calculate_layby_interest', { _layby_order_id: layby.id });

          if (interestError) {
            console.error('Error calculating interest:', interestError);
            continue;
          }

          overdueData.push({
            id: layby.id,
            layby_number: layby.layby_number,
            customer_name: layby.customer_name,
            balance_remaining: layby.balance_remaining,
            due_date: layby.due_date,
            interest_rate: layby.interest_rate,
            interest_amount: layby.interest_amount || 0,
            days_overdue: daysOverdue,
            calculated_interest: calculatedInterest || 0
          });
        }
      }

      setOverdueLaybys(overdueData);
    } catch (error) {
      console.error('Error fetching overdue laybys:', error);
      toast.error('Failed to load overdue layby orders');
    } finally {
      setLoading(false);
    }
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
      setSelectedLaybys(overdueLaybys.map(layby => layby.id));
    } else {
      setSelectedLaybys([]);
    }
  };

  const handleApplyInterest = async () => {
    if (selectedLaybys.length === 0) {
      toast.error('Please select at least one layby order');
      return;
    }

    if (!currentStore || !user) {
      toast.error('Store or user not found');
      return;
    }

    setApplying(true);

    try {
      for (const laybyId of selectedLaybys) {
        const layby = overdueLaybys.find(l => l.id === laybyId);
        if (!layby || layby.calculated_interest <= 0) continue;

        // Update layby order with new interest amount
        const newInterestAmount = layby.interest_amount + layby.calculated_interest;
        const newBalanceRemaining = layby.balance_remaining + layby.calculated_interest;

        const { error: updateError } = await supabase
          .from('layby_orders')
          .update({
            interest_amount: newInterestAmount,
            balance_remaining: newBalanceRemaining,
            updated_at: new Date().toISOString()
          })
          .eq('id', laybyId);

        if (updateError) {
          throw updateError;
        }

        // Create history entry
        await supabase
          .from('layby_history')
          .insert({
            layby_order_id: laybyId,
            action_type: 'interest_applied',
            action_description: `Interest applied: $${layby.calculated_interest.toFixed(2)} for ${layby.days_overdue} days overdue`,
            amount_involved: layby.calculated_interest,
            performed_by: user.id,
            notes: `Interest rate: ${layby.interest_rate}% per year`
          });

        // Create transaction record for interest charge
        const { data: transactionNumber } = await supabase
          .rpc('generate_transaction_number', { store_id_param: currentStore.id });

        await supabase
          .from('transactions')
          .insert({
            store_id: currentStore.id,
            transaction_number: transactionNumber,
            transaction_type: 'layby_interest',
            amount: layby.calculated_interest,
            payment_method: 'interest_charge',
            reference_id: laybyId,
            reference_type: 'layby_order',
            customer_name: layby.customer_name,
            description: `Interest charge for overdue layby ${layby.layby_number}`,
            notes: `${layby.days_overdue} days overdue at ${layby.interest_rate}% per year`,
            processed_by: user.id
          });
      }

      toast.success(`Interest applied to ${selectedLaybys.length} layby orders`);
      onSuccess();
      onOpenChange(false);
      setSelectedLaybys([]);
    } catch (error) {
      console.error('Error applying interest:', error);
      toast.error('Failed to apply interest charges');
    } finally {
      setApplying(false);
    }
  };

  const totalInterestToApply = selectedLaybys.reduce((sum, laybyId) => {
    const layby = overdueLaybys.find(l => l.id === laybyId);
    return sum + (layby?.calculated_interest || 0);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Interest Calculator - Overdue Layby Orders
          </DialogTitle>
          <DialogDescription>
            Calculate and apply interest charges to overdue layby orders based on configured rates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Orders</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overdueLaybys.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interest Due</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ${overdueLaybys.reduce((sum, l) => sum + l.calculated_interest, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Selected Interest</CardTitle>
                <Calculator className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${totalInterestToApply.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
                <p className="text-muted-foreground">Calculating interest...</p>
              </div>
            </div>
          ) : overdueLaybys.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Overdue Orders with Interest</h3>
              <p className="text-muted-foreground">
                All layby orders are up to date or have no interest rate configured.
              </p>
            </div>
          ) : (
            <>
              {/* Action Bar */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLaybys.length === overdueLaybys.length && overdueLaybys.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-muted-foreground">
                    Select All ({selectedLaybys.length} of {overdueLaybys.length} selected)
                  </span>
                </div>

                <Button
                  onClick={handleApplyInterest}
                  disabled={selectedLaybys.length === 0 || applying}
                >
                  {applying ? "Applying..." : `Apply Interest ($${totalInterestToApply.toFixed(2)})`}
                </Button>
              </div>

              {/* Overdue Layby Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Layby Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Current Interest</TableHead>
                        <TableHead>New Interest</TableHead>
                        <TableHead>Total Interest</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueLaybys.map((layby) => (
                        <TableRow key={layby.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedLaybys.includes(layby.id)}
                              onChange={(e) => handleSelectLayby(layby.id, e.target.checked)}
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{layby.layby_number}</TableCell>
                          <TableCell>{layby.customer_name}</TableCell>
                          <TableCell>${layby.balance_remaining.toFixed(2)}</TableCell>
                          <TableCell>
                            <div>
                              {new Date(layby.due_date).toLocaleDateString()}
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Overdue
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-red-600">
                              {layby.days_overdue} days
                            </Badge>
                          </TableCell>
                          <TableCell>{(layby.interest_rate * 100).toFixed(2)}%</TableCell>
                          <TableCell>${layby.interest_amount.toFixed(2)}</TableCell>
                          <TableCell className="font-medium text-orange-600">
                            ${layby.calculated_interest.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-bold">
                            ${(layby.interest_amount + layby.calculated_interest).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
