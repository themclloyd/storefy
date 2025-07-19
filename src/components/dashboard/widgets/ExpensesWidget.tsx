import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CircleDollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Plus,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentStore } from '@/stores/storeStore';
import { useStoreData } from '@/hooks/useSupabaseClient';

interface ExpensesWidgetProps {
  onViewMore: () => void;
}

interface ExpenseData {
  totalExpenses: number;
  monthlyExpenses: number;
  expenseGrowth: number;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export function ExpensesWidget({ onViewMore }: ExpensesWidgetProps) {
  const currentStore = useCurrentStore();
  const { from, currentStoreId, isPinSession } = useStoreData();
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<ExpenseData>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    expenseGrowth: 0,
    recentExpenses: [],
    topCategories: []
  });

  useEffect(() => {
    if (currentStore) {
      fetchExpenseData();
    }
  }, [currentStore]);

  const fetchExpenseData = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];
      const thisMonth = today.substring(0, 7); // YYYY-MM format
      const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0].substring(0, 7);

      // Fetch today's expenses
      const { data: todayExpenses } = await supabase
        .from('expenses')
        .select('id, description, amount, category, date, created_at')
        .eq('store_id', currentStore.id)
        .eq('date', today)
        .order('created_at', { ascending: false });

      // Fetch this month's expenses
      const { data: monthExpenses } = await supabase
        .from('expenses')
        .select('id, description, amount, category, date, created_at')
        .eq('store_id', currentStore.id)
        .like('date', `${thisMonth}%`)
        .order('created_at', { ascending: false });

      // Fetch last month's expenses for growth calculation
      const { data: lastMonthExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('store_id', currentStore.id)
        .like('date', `${lastMonth}%`);

      // Calculate expense metrics
      const totalExpenses = todayExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const monthlyExpenses = monthExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      // Calculate expense growth
      const lastMonthTotal = lastMonthExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const expenseGrowth = lastMonthTotal > 0 ? ((monthlyExpenses - lastMonthTotal) / lastMonthTotal) * 100 : 0;

      // Format recent expenses
      const recentExpenses = monthExpenses?.slice(0, 3).map(expense => {
        const timeDiff = Date.now() - new Date(expense.created_at).getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        let timeString;

        if (hoursAgo < 24) {
          timeString = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
        } else {
          const daysAgo = Math.floor(hoursAgo / 24);
          timeString = `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
        }

        return {
          id: expense.id,
          description: expense.description,
          amount: Number(expense.amount),
          category: expense.category,
          date: timeString
        };
      }) || [];

      // Calculate top expense categories
      const categoryTotals = {};
      monthExpenses?.forEach(expense => {
        const category = expense.category || 'Uncategorized';
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount);
      });

      const topCategories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount: Number(amount),
          percentage: monthlyExpenses > 0 ? (Number(amount) / monthlyExpenses) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

      setExpenseData({
        totalExpenses,
        monthlyExpenses,
        expenseGrowth,
        recentExpenses,
        topCategories
      });
    } catch (error) {
      console.error('Error fetching expense data:', error);
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

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center text-xs ${isPositive ? 'text-destructive' : 'text-success'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        <span>{Math.abs(growth).toFixed(1)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Expenses Overview</CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4 text-primary" />
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
              <CircleDollarSign className="w-4 h-4 text-primary" />
            </div>
            Expenses Overview
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
        {/* Main Expense Metrics */}
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(expenseData.totalExpenses)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Today's Expenses</span>
              {formatGrowth(expenseData.expenseGrowth)}
            </div>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(expenseData.monthlyExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Top Categories</h4>
          <div className="space-y-2">
            {expenseData.topCategories.slice(0, 3).map((category, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{category.category}</div>
                  <div className="text-xs text-muted-foreground">{category.percentage}% of total</div>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatCurrency(category.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Recent Expenses</h4>
            <Badge variant="secondary" className="text-xs">
              {expenseData.recentExpenses.length} today
            </Badge>
          </div>
          
          <div className="space-y-2">
            {expenseData.recentExpenses.slice(0, 2).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{expense.description}</div>
                  <div className="text-xs text-muted-foreground">{expense.category} • {expense.date}</div>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 h-8"
              onClick={onViewMore}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Expense
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-8"
              onClick={onViewMore}
            >
              <Eye className="w-3 h-3 mr-1" />
              View All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
