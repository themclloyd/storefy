import React from "react";
import { Target } from "lucide-react";
import { BusinessMetricsWidget } from "./BusinessMetricsWidget";

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
  const acquisitionRate = totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0;
  const ltvToCAC = acquisitionCost > 0 ? lifetimeValue / acquisitionCost : 0;
  
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
          change: acquisitionRate,
          changeType: acquisitionRate >= 0 ? 'increase' : 'decrease',
          subtitle: `Total: ${totalCustomers}`
        },
        {
          label: "LTV/CAC Ratio",
          value: ltvToCAC,
          format: 'number',
          status: ltvToCAC >= 3 ? 'good' : ltvToCAC >= 1 ? 'warning' : 'critical'
        }
      ]}
    />
  );
} 