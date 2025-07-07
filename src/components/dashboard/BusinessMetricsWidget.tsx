// This file has been refactored.
// All widgets are now in ./BusinessMetricsWidget/
// Please import from '@/components/dashboard/BusinessMetricsWidget'

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Clock, 
  Target,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

interface MetricData {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  target?: number;
  progress?: number;
  format?: 'currency' | 'percentage' | 'number' | 'time';
  status?: 'good' | 'warning' | 'critical';
  subtitle?: string;
}

interface BusinessMetricsWidgetProps {
  title: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  metrics: MetricData[];
  className?: string;
}

export function BusinessMetricsWidget({ 
  title, 
  icon: Icon, 
  iconColor, 
  metrics, 
  className = "" 
}: BusinessMetricsWidgetProps) {
  
  const formatValue = (value: string | number, format?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return `${value.toFixed(0)}min`;
      default:
        return value.toString();
    }
  };

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return <ArrowUp className="w-3 h-3" />;
      case 'decrease':
        return <ArrowDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getChangeColor = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-success';
      case 'decrease':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good':
        return 'border-success text-success';
      case 'warning':
        return 'border-orange-500 text-orange-500';
      case 'critical':
        return 'border-destructive text-destructive';
      default:
        return 'border-muted-foreground text-muted-foreground';
    }
  };

  return (
    <Card className={`card-professional ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`w-10 h-10 ${iconColor}/10 rounded-lg flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              {metric.status && (
                <Badge variant="outline" className={getStatusColor(metric.status)}>
                  {metric.status}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">
                {formatValue(metric.value, metric.format)}
              </span>
              
              {metric.change !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(metric.changeType)}`}>
                  {getChangeIcon(metric.changeType)}
                  {Math.abs(metric.change).toFixed(1)}%
                </div>
              )}
            </div>

            {metric.subtitle && (
              <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
            )}

            {metric.target && metric.progress !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Target: {formatValue(metric.target, metric.format)}</span>
                  <span className="text-foreground">{metric.progress.toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(metric.progress, 100)} className="h-1.5" />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Specialized metric widgets for different business areas
export function SalesVelocityWidget({ 
  currentSales, 
  previousSales, 
  target, 
  timeframe = "today" 
}: {
  currentSales: number;
  previousSales: number;
  target: number;
  timeframe?: string;
}) {
  const velocity = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0;
  const progress = (currentSales / target) * 100;
  
  return (
    <BusinessMetricsWidget
      title="Sales Velocity"
      icon={TrendingUp}
      iconColor="text-green-500"
      metrics={[
        {
          label: `Sales ${timeframe}`,
          value: currentSales,
          format: 'currency',
          change: velocity,
          changeType: velocity >= 0 ? 'increase' : 'decrease',
          target: target,
          progress: progress,
          status: progress >= 100 ? 'good' : progress >= 75 ? 'warning' : 'critical'
        }
      ]}
    />
  );
}

export function InventoryTurnoverWidget({ 
  turnoverRate, 
  averageDays, 
  optimalRate 
}: {
  turnoverRate: number;
  averageDays: number;
  optimalRate: number;
}) {
  const efficiency = (turnoverRate / optimalRate) * 100;
  
  return (
    <BusinessMetricsWidget
      title="Inventory Turnover"
      icon={Clock}
      iconColor="text-blue-500"
      metrics={[
        {
          label: "Turnover Rate",
          value: turnoverRate,
          format: 'number',
          subtitle: `${averageDays} days average`,
          status: turnoverRate >= optimalRate ? 'good' : turnoverRate >= optimalRate * 0.7 ? 'warning' : 'critical'
        },
        {
          label: "Efficiency",
          value: efficiency,
          format: 'percentage',
          changeType: efficiency >= 100 ? 'increase' : 'decrease'
        }
      ]}
    />
  );
}

export function ProfitMarginWidget({ 
  grossMargin, 
  netMargin, 
  targetMargin 
}: {
  grossMargin: number;
  netMargin: number;
  targetMargin: number;
}) {
  const marginHealth = netMargin >= targetMargin ? 'good' : netMargin >= targetMargin * 0.8 ? 'warning' : 'critical';
  
  return (
    <BusinessMetricsWidget
      title="Profit Analysis"
      icon={Percent}
      iconColor="text-purple-500"
      metrics={[
        {
          label: "Gross Margin",
          value: grossMargin,
          format: 'percentage',
          status: grossMargin >= 30 ? 'good' : grossMargin >= 20 ? 'warning' : 'critical'
        },
        {
          label: "Net Margin",
          value: netMargin,
          format: 'percentage',
          target: targetMargin,
          progress: (netMargin / targetMargin) * 100,
          status: marginHealth
        }
      ]}
    />
  );
}

export function CustomerAcquisitionWidget({ 
  newCustomers, 
  totalCustomers, 
  acquisitionCost, 
  lifetimeValue 
}: {
  newCustomers: number;
  totalCustomers: number;
  acquisitionCost: number;
  lifetimeValue: number;
}) {
  const growthRate = totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0;
  const roi = acquisitionCost > 0 ? (lifetimeValue / acquisitionCost) * 100 : 0;
  
  return (
    <BusinessMetricsWidget
      title="Customer Acquisition"
      icon={Target}
      iconColor="text-orange-500"
      metrics={[
        {
          label: "New Customers",
          value: newCustomers,
          format: 'number',
          subtitle: `${growthRate.toFixed(1)}% growth rate`
        },
        {
          label: "Acquisition ROI",
          value: roi,
          format: 'percentage',
          status: roi >= 300 ? 'good' : roi >= 200 ? 'warning' : 'critical'
        },
        {
          label: "Lifetime Value",
          value: lifetimeValue,
          format: 'currency',
          changeType: lifetimeValue > acquisitionCost * 3 ? 'increase' : 'decrease'
        }
      ]}
    />
  );
}
