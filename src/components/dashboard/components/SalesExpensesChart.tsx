import React, { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useResponsiveChart } from '@/hooks/useResponsive';
import type { ChartDataPoint } from '../types';

interface SalesExpensesChartProps {
  chartData: ChartDataPoint[];
  chartPeriod: 'daily' | 'weekly' | 'monthly';
  onChartPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void;
  formatCurrency: (amount: number) => string;
}

/**
 * Sales vs Expenses chart component with period selector
 */
export const SalesExpensesChart = memo(function SalesExpensesChart({
  chartData,
  chartPeriod,
  onChartPeriodChange,
  formatCurrency
}: SalesExpensesChartProps) {
  const handleChartPeriodChange = useCallback((value: 'daily' | 'weekly' | 'monthly') => {
    onChartPeriodChange(value);
  }, [onChartPeriodChange]);

  // Get responsive chart configuration
  const chartConfig = useResponsiveChart();

  // Memoize tooltip formatter for better performance
  const tooltipFormatter = useCallback((value: number, name: string) => [
    formatCurrency(value),
    name === 'sales' ? 'Sales' : name === 'expenses' ? 'Expenses' : 'Profit'
  ], [formatCurrency]);

  return (
    <Card className="h-64 sm:h-72 lg:h-80 border border-border/40 bg-card shadow-sm">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <span className="line-clamp-1 text-foreground">
              Sales vs Expenses
            </span>
          </CardTitle>
          <Select value={chartPeriod} onValueChange={handleChartPeriodChange}>
            <SelectTrigger className="w-full xs:w-24 sm:w-28 lg:w-32 border-border/40 bg-background text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-2 sm:px-4 lg:px-6">
        <div className="h-44 sm:h-52 lg:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={chartConfig.margin}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              {chartConfig.showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.3}
                />
              )}
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: chartConfig.fontSize, fill: 'hsl(var(--muted-foreground))' }}
                interval={chartConfig.tickInterval}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: chartConfig.fontSize, fill: 'hsl(var(--muted-foreground))' }}
                width={chartConfig.yAxisWidth}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  fontSize: `${chartConfig.fontSize}px`
                }}
                formatter={tooltipFormatter}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="hsl(var(--primary))"
                fill="url(#salesGradient)"
                strokeWidth={chartConfig.strokeWidth}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="hsl(var(--destructive))"
                fill="url(#expensesGradient)"
                strokeWidth={chartConfig.strokeWidth}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

SalesExpensesChart.displayName = 'SalesExpensesChart';
