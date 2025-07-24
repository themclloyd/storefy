import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  MoreHorizontal,
  Download,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { dashboardDesign, responsiveSpacing } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';

interface ChartData {
  [key: string]: any;
}

interface BaseChartProps {
  title: string;
  subtitle?: string;
  data: ChartData[];
  height?: number;
  loading?: boolean;
  onExport?: () => void;
  onRefresh?: () => void;
  onExpand?: () => void;
  className?: string;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={cn(
        "bg-background border border-border rounded-lg shadow-lg p-3",
        dashboardDesign.cards.elevated
      )}>
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Chart Header Component
const ChartHeader = ({
  title,
  subtitle,
  onExport,
  onRefresh,
  onExpand,
  loading = false
}: {
  title: string;
  subtitle?: string;
  onExport?: () => void;
  onRefresh?: () => void;
  onExpand?: () => void;
  loading?: boolean;
}) => (
  <CardHeader className="pb-4">
    <div className="flex items-start justify-between">
      <div>
        <CardTitle className={dashboardDesign.hierarchy.secondary}>
          {title}
        </CardTitle>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className={dashboardDesign.animations.smooth}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              loading && "animate-spin"
            )} />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={dashboardDesign.animations.smooth}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onExport && (
              <DropdownMenuItem onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
            )}
            {onExpand && (
              <DropdownMenuItem onClick={onExpand}>
                <Maximize2 className="h-4 w-4 mr-2" />
                Expand View
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </CardHeader>
);

// Area Chart Component
export function ModernAreaChart({
  title,
  subtitle,
  data,
  height = 300,
  loading = false,
  onExport,
  onRefresh,
  onExpand,
  className,
  dataKey = 'value',
  xAxisKey = 'name',
  color = dashboardDesign.colors.primary,
  formatter
}: BaseChartProps & {
  dataKey?: string;
  xAxisKey?: string;
  color?: string;
  formatter?: (value: any) => string;
}) {
  if (loading) {
    return (
      <Card className={cn(dashboardDesign.cards.elevated, className)}>
        <ChartHeader title={title} subtitle={subtitle} loading={loading} />
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[300px] bg-muted rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(dashboardDesign.cards.elevated, className)}>
      <ChartHeader
        title={title}
        subtitle={subtitle}
        onExport={onExport}
        onRefresh={onRefresh}
        onExpand={onExpand}
        loading={loading}
      />
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip formatter={formatter} />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${dataKey})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Bar Chart Component
export function ModernBarChart({
  title,
  subtitle,
  data,
  height = 300,
  loading = false,
  onExport,
  onRefresh,
  onExpand,
  className,
  dataKey = 'value',
  xAxisKey = 'name',
  color = dashboardDesign.colors.primary,
  formatter
}: BaseChartProps & {
  dataKey?: string;
  xAxisKey?: string;
  color?: string;
  formatter?: (value: any) => string;
}) {
  if (loading) {
    return (
      <Card className={cn(dashboardDesign.cards.elevated, className)}>
        <ChartHeader title={title} subtitle={subtitle} loading={loading} />
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[300px] bg-muted rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(dashboardDesign.cards.elevated, className)}>
      <ChartHeader
        title={title}
        subtitle={subtitle}
        onExport={onExport}
        onRefresh={onRefresh}
        onExpand={onExpand}
        loading={loading}
      />
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip formatter={formatter} />} />
              <Bar
                dataKey={dataKey}
                fill={color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Pie Chart Component
export function ModernPieChart({
  title,
  subtitle,
  data,
  height = 300,
  loading = false,
  onExport,
  onRefresh,
  onExpand,
  className,
  dataKey = 'value',
  nameKey = 'name',
  colors = dashboardDesign.colors.chart
}: BaseChartProps & {
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
}) {
  if (loading) {
    return (
      <Card className={cn(dashboardDesign.cards.elevated, className)}>
        <ChartHeader title={title} subtitle={subtitle} loading={loading} />
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[300px] bg-muted rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(dashboardDesign.cards.elevated, className)}>
      <ChartHeader
        title={title}
        subtitle={subtitle}
        onExport={onExport}
        onRefresh={onRefresh}
        onExpand={onExpand}
        loading={loading}
      />
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
