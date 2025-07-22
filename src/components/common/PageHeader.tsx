import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveH1, ResponsiveBodyText, ResponsiveContainer } from "@/components/ui/responsive-typography";
import { useScreenSize } from "@/hooks/use-mobile";
import { responsiveSpacing, touchFriendly } from "@/lib/responsive-utils";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className = ""
}: PageHeaderProps) {
  const { isMobile } = useScreenSize();

  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center justify-between",
      responsiveSpacing.gap.sm,
      className
    )}>
      <div className={cn("flex items-center", responsiveSpacing.gap.xs)}>
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <ResponsiveH1 className="tracking-tight">
            {title}
          </ResponsiveH1>
          {description && (
            <ResponsiveBodyText
              className="text-muted-foreground mt-0.5"
              as="p"
            >
              {description}
            </ResponsiveBodyText>
          )}
        </div>
      </div>
      {actions && (
        <div className={cn(
          "flex items-center flex-wrap",
          responsiveSpacing.gap.xs,
          isMobile && touchFriendly.touchSpacing
        )}>
          {actions}
        </div>
      )}
    </div>
  );
}

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <div className={`h-full ${className}`}>
      {children}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = ""
}: StatsCardProps) {
  return (
    <div className={`card-professional ${className}`}>
      <div className="flex items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
        <h3 className="text-sm font-medium text-muted-foreground">
          {title}
        </h3>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="text-2xl font-bold text-foreground">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className={`text-xs ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
    </div>
  );
}
