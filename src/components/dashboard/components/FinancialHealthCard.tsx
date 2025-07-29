import React, { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '../types';

interface FinancialHealthCardProps {
  stats: DashboardStats;
  formatCurrency: (amount: number) => string;
  onViewChange: (view: string) => void;
}

/**
 * Financial health analysis card showing profit/loss and key metrics
 */
export const FinancialHealthCard = memo(function FinancialHealthCard({
  stats,
  formatCurrency,
  onViewChange
}: FinancialHealthCardProps) {
  const handleExpensesClick = useCallback(() => {
    onViewChange('expenses');
  }, [onViewChange]);

  return (
    <Card className="h-80 border border-border/40 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            stats.profit >= 0 ? "bg-green-500/10" : "bg-red-500/10"
          )}>
            {stats.profit >= 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <span className="text-foreground">
            Financial Health
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profit/Loss Summary */}
        <div className={cn(
          "text-center p-4 rounded-lg border",
          stats.profit >= 0 ? "bg-green-50/50 border-green-200/50" : "bg-red-50/50 border-red-200/50"
        )}>

          <div className={cn(
            "text-xl sm:text-2xl font-bold mb-2 tracking-tight",
            stats.profit >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {stats.profit >= 0 ? "+" : ""}{formatCurrency(stats.profit)}
          </div>
          <p className={cn(
            "text-sm font-medium mb-1",
            stats.profit >= 0 ? "text-green-700" : "text-red-700"
          )}>
            {stats.profit >= 0 ? "You're winning! 🎉" : "Need attention ⚠️"}
          </p>
          <p className="text-xs text-muted-foreground">
            Profit Margin: {stats.profitMargin.toFixed(1)}%
          </p>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Expenses</span>
            <span className="font-medium text-destructive">{formatCurrency(stats.totalExpenses)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Today's Expenses</span>
            <span className="font-medium text-destructive">{formatCurrency(stats.todayExpenses)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Inventory Value</span>
            <span className="font-medium">{formatCurrency(stats.inventoryValue)}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          className="w-full"
          variant={stats.profit >= 0 ? "default" : "destructive"}
          onClick={handleExpensesClick}
        >
          {stats.profit >= 0 ? "View Details" : "Review Expenses"}
        </Button>
      </CardContent>
    </Card>
  );
});

FinancialHealthCard.displayName = 'FinancialHealthCard';
