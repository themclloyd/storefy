import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { useScreenSize } from '@/hooks/use-mobile';

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
          'cursor-pointer transition-shadow',
          onClick && 'hover:shadow-md',
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            {children}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <tr 
      className={cn(
        onClick && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function ResponsiveTableCell({ 
  children, 
  className, 
  label, 
  primary = false 
}: ResponsiveTableCellProps) {
  const { isMobile } = useScreenSize();
  
  if (isMobile) {
    return (
      <div className={cn(
        'flex justify-between items-center',
        primary && 'font-medium text-foreground',
        !primary && 'text-sm text-muted-foreground',
        className
      )}>
        {label && (
          <span className="font-medium text-muted-foreground">
            {label}:
          </span>
        )}
        <span className={primary ? 'font-semibold' : ''}>
          {children}
        </span>
      </div>
    );
  }

  return (
    <td className={cn('px-4 py-2', className)}>
      {children}
    </td>
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
