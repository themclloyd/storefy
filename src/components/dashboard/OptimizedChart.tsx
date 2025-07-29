import React, { memo, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  date: string;
  sales: number;
  expenses: number;
  profit: number;
  orders: number;
}

interface OptimizedChartProps {
  data: ChartData[];
  formatCurrency: (value: number) => string;
}

// Memoized tooltip component to prevent unnecessary re-renders
const CustomTooltip = memo(function CustomTooltip({ active, payload, label, formatCurrency }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.name === 'sales' ? 'Sales' : entry.name === 'expenses' ? 'Expenses' : 'Profit'}:
          </span>
          <span className="font-medium text-foreground">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
});

export const OptimizedChart = memo(function OptimizedChart({ data, formatCurrency }: OptimizedChartProps) {
  // Memoize chart configuration to prevent recreation
  const chartConfig = useMemo(() => ({
    margin: { top: 10, right: 10, left: 0, bottom: 0 },
    syncId: 'dashboard-chart'
  }), []);

  // Memoize gradients to prevent DOM recreation
  const gradients = useMemo(() => (
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
  ), []);

  // Memoize axis configuration
  const axisConfig = useMemo(() => ({
    xAxis: {
      axisLine: false,
      tickLine: false,
      tick: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }
    },
    yAxis: {
      axisLine: false,
      tickLine: false,
      tick: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }
    }
  }), []);

  // Memoize grid configuration
  const gridConfig = useMemo(() => ({
    strokeDasharray: "3 3",
    stroke: "hsl(var(--border))",
    strokeOpacity: 0.3
  }), []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} {...chartConfig}>
        {gradients}
        <CartesianGrid {...gridConfig} />
        <XAxis 
          dataKey="date" 
          {...axisConfig.xAxis}
        />
        <YAxis {...axisConfig.yAxis} />
        <Tooltip
          content={(props) => (
            <CustomTooltip {...props} formatCurrency={formatCurrency} />
          )}
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="hsl(var(--primary))"
          fill="url(#salesGradient)"
          strokeWidth={2}
          isAnimationActive={false} // Disable animations for better performance
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="hsl(var(--destructive))"
          fill="url(#expensesGradient)"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// Performance monitoring wrapper (optional)
export const MonitoredChart = memo(function MonitoredChart(props: OptimizedChartProps) {
  const startTime = performance.now();
  
  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`Chart render took ${renderTime.toFixed(2)}ms`);
    }
  });

  return <OptimizedChart {...props} />;
});
