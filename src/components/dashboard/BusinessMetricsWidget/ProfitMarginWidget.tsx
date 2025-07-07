import React from "react";
import { Percent } from "lucide-react";
import { BusinessMetricsWidget } from "./BusinessMetricsWidget";

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