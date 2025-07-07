import React from "react";
import { TrendingUp } from "lucide-react";
import { BusinessMetricsWidget } from "./BusinessMetricsWidget";

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