import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { DashboardHeader } from './components/DashboardHeader';

import { useCurrentStore } from '@/stores/storeStore';
import { useExpenses, useFetchExpenses, useExpenseStats } from '@/stores/expenseStore';
import { useTransactions, useFetchTransactions, useTransactionStats, useTotalTransactions } from '@/stores/transactionStore';
import { useProducts, useFetchProducts } from '@/stores/inventoryStore';
import { useLaybyOrders, useFetchLaybyOrders, useLaybyStats } from '@/stores/laybyStore';
import { useCustomers, useFetchCustomers } from '@/stores/customerStore';
import { cn } from '@/lib/utils';
import { DashboardEmptyState } from './components/DashboardEmptyState';
// Direct imports to prevent lazy loading flickering
import { SalesExpensesChart } from './components/SalesExpensesChart';
import { FinancialHealthCard } from './components/FinancialHealthCard';
import { TopSellingProductsCard } from './components/TopSellingProductsCard';
import { MetricsGrid } from './components/MetricsGrid';
import { useResponsive } from '@/hooks/useResponsive';

interface DashboardProps {
  onViewChange: (view: string) => void;
}





export const SimpleFocusedDashboard = memo(function SimpleFocusedDashboard({ onViewChange }: DashboardProps) {
  const currentStore = useCurrentStore();
  const { isMobile, isTablet } = useResponsive();
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Get data from existing stores - no duplicate fetching!
  const transactions = useTransactions();
  const expenses = useExpenses();
  const products = useProducts();
  const laybyOrders = useLaybyOrders();
  const customers = useCustomers();

  // Get stats from existing stores
  const expenseStats = useExpenseStats();
  const todayRevenue = useTransactionStats();
  const totalTransactions = useTotalTransactions();
  const laybyStats = useLaybyStats();

  // Get fetch functions to trigger data loading if needed
  const fetchTransactions = useFetchTransactions();
  const fetchExpenses = useFetchExpenses();
  const fetchProducts = useFetchProducts();
  const fetchLaybyOrders = useFetchLaybyOrders();
  const fetchCustomers = useFetchCustomers();

  // Simple static states - no dynamic loading logic to prevent flickering
  const loading = false; // Always show content, let individual stores handle their loading
  const error = null; // Individual stores handle their own errors
  const isRefreshing = false;
  const lastUpdated = new Date();

  // Memoize the store ID to prevent unnecessary effect runs
  const storeId = useMemo(() => currentStore?.id, [currentStore?.id]);

  // Fetch data from all stores when store changes
  useEffect(() => {
    if (storeId) {
      // Trigger data fetching from existing stores
      fetchTransactions(storeId);
      fetchExpenses(storeId);
      fetchProducts(storeId);
      fetchLaybyOrders(storeId);
      fetchCustomers(storeId);
    }
  }, [storeId, fetchTransactions, fetchExpenses, fetchProducts, fetchLaybyOrders, fetchCustomers]);

  // Calculate simple dashboard stats from existing store data
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calculate today's sales from transactions
    const todayTransactions = transactions.filter(t =>
      t.created_at?.startsWith(todayStr)
    );
    const todaySales = todayTransactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);

    // Calculate today's expenses
    const todayExpenses = expenses
      .filter(e => e.expense_date?.startsWith(todayStr))
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Calculate today's layby
    const todayLayby = laybyOrders
      .filter(l => l.created_at?.startsWith(todayStr))
      .reduce((sum, l) => sum + (parseFloat(l.total_amount) || 0), 0);

    // Calculate inventory value
    const inventoryValue = products.reduce((sum, p) =>
      sum + (parseFloat(p.price) || 0) * (parseInt(p.stock_quantity) || 0), 0
    );

    // Calculate profit
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalSales = transactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    const profit = totalSales - totalExpenses;
    const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

    return {
      todaySales,
      todayOrders: todayTransactions.length,
      todayLayby,
      inventoryValue,
      totalExpenses,
      todayExpenses,
      profit,
      profitMargin,
      topSellingItems: [], // Simplified for now
      chartData: [], // Simplified for now
      previousDayComparison: {
        salesChange: 0,
        ordersChange: 0,
        laybyChange: 0
      }
    };
  }, [transactions, expenses, laybyOrders, products]);

  // Memoize chart period to prevent unnecessary recalculations
  const memoizedChartPeriod = useMemo(() => chartPeriod, [chartPeriod]);

  // Simple currency formatter
  const formatCurrency = useCallback((amount: number) => {
    const currency = currentStore?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }, [currentStore?.currency]);

  // Memoize navigation callbacks
  const handleViewChange = useCallback((view: string) => {
    onViewChange(view);
  }, [onViewChange]);

  const handleChartPeriodChange = useCallback((value: 'daily' | 'weekly' | 'monthly') => {
    setChartPeriod(value);
  }, []);

  // Simple refetch function that refreshes all stores
  const refetch = useCallback(() => {
    if (storeId) {
      fetchTransactions(storeId);
      fetchExpenses(storeId);
      fetchProducts(storeId);
      fetchLaybyOrders(storeId);
      fetchCustomers(storeId);
    }
  }, [storeId, fetchTransactions, fetchExpenses, fetchProducts, fetchLaybyOrders, fetchCustomers]);

  // No loading or error states - always show content

  // Check if this is a new store with no data
  const hasData = (
    (transactions && transactions.length > 0) ||
    (products && products.length > 0) ||
    (laybyOrders && laybyOrders.length > 0)
  );

  if (!hasData) {
    return <DashboardEmptyState onViewChange={onViewChange} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
        <DashboardHeader
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          onRefresh={refetch}
        />

        <MetricsGrid
          stats={stats}
          formatCurrency={formatCurrency}
          onViewChange={handleViewChange}
        />

        {/* Bottom Section - Charts and Analysis */}
        <div className={cn(
          "grid gap-4 sm:gap-6 lg:gap-8",
          isMobile ? "grid-cols-1" : isTablet ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"
        )}>
          <SalesExpensesChart
            chartData={stats.chartData}
            chartPeriod={memoizedChartPeriod}
            onChartPeriodChange={handleChartPeriodChange}
            formatCurrency={formatCurrency}
          />

          <FinancialHealthCard
            stats={stats}
            formatCurrency={formatCurrency}
            onViewChange={onViewChange}
          />
        </div>

        <TopSellingProductsCard
          topSellingItems={stats.topSellingItems}
          onViewChange={onViewChange}
        />
      </div>
    </div>
  );
});
