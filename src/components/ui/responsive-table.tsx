import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { useScreenSize } from '@/hooks/use-mobile';
import { responsiveSpacing, touchFriendly } from '@/lib/responsive-utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  className?: string;
  label?: string; // For mobile card view
  primary?: boolean; // Mark as primary content for mobile
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  const { isMobile } = useScreenSize();
  
  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full', className)}>
        {children}
      </table>
    </div>
  );
}

export function ResponsiveTableHeader({ children, className }: ResponsiveTableHeaderProps) {
  const { isMobile } = useScreenSize();
  
  if (isMobile) {
    return null; // Hide headers on mobile
  }

  return (
    <thead className={className}>
      {children}
    </thead>
  );
}

export function ResponsiveTableBody({ children, className }: ResponsiveTableBodyProps) {
  const { isMobile } = useScreenSize();

  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        {children}
      </div>
    );
  }

  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
}

export function ResponsiveTableRow({ children, className, onClick }: ResponsiveTableRowProps) {
  const { isMobile } = useScreenSize();

  if (isMobile) {
    return (
      <Card
        className={cn(
          'cursor-pointer transition-colors hover:bg-muted/50',
          onClick && 'min-h-[44px]', // Touch-friendly
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {children}
        </CardContent>
      </Card>
    );
  }

  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function ResponsiveTableCell({ children, className, label, primary }: ResponsiveTableCellProps) {
  const { isMobile } = useScreenSize();

  if (isMobile) {
    return (
      <div className={cn(
        'flex justify-between items-center py-1',
        primary && 'font-medium text-foreground',
        className
      )}>
        {label && (
          <span className="text-sm font-medium text-muted-foreground">
            {label}:
          </span>
        )}
        <div className={cn('text-sm', primary && 'font-medium')}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <td className={cn('px-4 py-3 text-sm', className)}>
      {children}
    </td>
  );
}

// Enhanced responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    default: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  itemMinWidth?: string;
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  itemMinWidth
}: ResponsiveGridProps) {
  // Build responsive grid classes
  const gridClasses = cn(
    'grid',
    // Base columns
    `grid-cols-${cols.default}`,
    // Mobile columns
    cols.mobile && `grid-cols-${cols.mobile}`,
    // Tablet columns
    cols.tablet && `md:grid-cols-${cols.tablet}`,
    // Desktop columns
    cols.desktop && `lg:grid-cols-${cols.desktop}`,
    // Gap
    responsiveSpacing.gap[gap],
    // Min width for items
    itemMinWidth && `[&>*]:min-w-[${itemMinWidth}]`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// Responsive card grid for common layouts
interface ResponsiveCardGridProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'products' | 'cards' | 'stats' | 'dashboard';
}

export function ResponsiveCardGrid({ children, className, variant = 'cards' }: ResponsiveCardGridProps) {
  const gridClass = {
    products: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    stats: 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    dashboard: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }[variant];

  return (
    <div className={cn(gridClass, responsiveSpacing.gap.md, className)}>
      {children}
    </div>
  );
}

// Header cell component for desktop
export function ResponsiveTableHeaderCell({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  const { isMobile } = useScreenSize();
  
  if (isMobile) {
    return null;
  }

  return (
    <th className={cn('px-4 py-3 text-left font-medium text-muted-foreground', className)}>
      {children}
    </th>
  );
}
