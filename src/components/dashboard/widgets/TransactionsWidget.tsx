import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  ArrowRight, 
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentStore } from '@/stores/storeStore';
import { supabase } from '@/integrations/supabase/client';

interface TransactionsWidgetProps {
  onViewMore: () => void;
}

interface TransactionData {
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  refundedTransactions: number;
  recentTransactions: Array<{
    id: string;
    reference: string;
    amount: number;
    customer: string;
    time: string;
    status: 'completed' | 'pending' | 'refunded';
    items: number;
  }>;
}

export function TransactionsWidget({ onViewMore }: TransactionsWidgetProps) {
  const currentStore = useCurrentStore();
  const [loading, setLoading] = useState(true);
  const [transactionData, setTransactionData] = useState<TransactionData>({
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    refundedTransactions: 0,
    recentTransactions: []
  });

  useEffect(() => {
    if (currentStore) {
      fetchTransactionData();
    }
  }, [currentStore]);

  const fetchTransactionData = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];

      // Fetch today's transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          reference,
          total_amount,
          status,
          created_at,
          customers (name),
          transaction_items (quantity)
        `)
        .eq('store_id', currentStore.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      if (!transactions || transactions.length === 0) {
        setTransactionData({
          totalTransactions: 0,
          completedTransactions: 0,
          pendingTransactions: 0,
          refundedTransactions: 0,
          recentTransactions: []
        });
        setLoading(false);
        return;
      }

      // Calculate transaction metrics
      const totalTransactions = transactions.length;
      const completedTransactions = transactions.filter(t => t.status === 'completed').length;
      const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
      const refundedTransactions = transactions.filter(t => t.status === 'refunded').length;

      // Format recent transactions
      const recentTransactions = transactions.slice(0, 4).map(transaction => {
        const timeDiff = Date.now() - new Date(transaction.created_at).getTime();
        const minutesAgo = Math.floor(timeDiff / (1000 * 60));
        let timeString;

        if (minutesAgo < 60) {
          timeString = `${minutesAgo} min ago`;
        } else {
          const hoursAgo = Math.floor(minutesAgo / 60);
          timeString = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
        }

        // Count items
        const items = transaction.transaction_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

        return {
          id: transaction.id,
          reference: transaction.reference || `TRX-${transaction.id.substring(0, 6)}`,
          amount: Number(transaction.total_amount),
          customer: transaction.customers?.name || 'Walk-in Customer',
          time: timeString,
          status: transaction.status,
          items
        };
      });

      setTransactionData({
        totalTransactions,
        completedTransactions,
        pendingTransactions,
        refundedTransactions,
        recentTransactions
      });
    } catch (error) {
      console.error('Error fetching transaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="text-xs bg-success/10 text-success">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs bg-warning/10 text-warning">Pending</Badge>;
      case 'refunded':
        return <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">Refunded</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'refunded':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Transactions</CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-primary" />
            </div>
            Transactions
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewMore}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Transaction Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-muted/30 rounded-lg text-center">
            <div className="text-lg font-semibold text-success">
              {transactionData.completedTransactions}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg text-center">
            <div className="text-lg font-semibold text-warning">
              {transactionData.pendingTransactions}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg text-center">
            <div className="text-lg font-semibold text-destructive">
              {transactionData.refundedTransactions}
            </div>
            <div className="text-xs text-muted-foreground">Refunded</div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Recent Transactions</h4>
            <Badge variant="secondary" className="text-xs">
              {transactionData.totalTransactions} today
            </Badge>
          </div>
          
          <div className="space-y-2">
            {transactionData.recentTransactions.slice(0, 4).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(transaction.status)}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{transaction.reference}</div>
                    <div className="text-xs text-muted-foreground">
                      {transaction.customer} • {transaction.time}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="pt-2 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-8"
            onClick={onViewMore}
          >
            <Eye className="w-3 h-3 mr-1" />
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
