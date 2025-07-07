import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useTax } from "@/hooks/useTax";

export interface MetricData {
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

export interface BusinessMetricsWidgetProps {
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
  const { formatCurrency } = useTax();

  const formatValue = (value: string | number, format?: string) => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return formatCurrency(value);
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