import React from "react";
import { Clock } from "lucide-react";
import { BusinessMetricsWidget } from "./BusinessMetricsWidget";

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