import React from 'react';
import { dashboardDesign, responsiveSpacing, compactSpacing } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';

// Grid container types
type GridSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full';
type GridBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface GridItemProps {
  children: React.ReactNode;
  span?: GridSpan;
  smSpan?: GridSpan;
  mdSpan?: GridSpan;
  lgSpan?: GridSpan;
  xlSpan?: GridSpan;
  order?: number;
  smOrder?: number;
  mdOrder?: number;
  lgOrder?: number;
  xlOrder?: number;
  className?: string;
}

interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 12 | 8 | 6 | 4;
  gap?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
}

// Helper function to generate span classes
const getSpanClass = (span: GridSpan, breakpoint?: GridBreakpoint): string => {
  if (span === 'full') {
    return breakpoint ? `${breakpoint}:col-span-full` : 'col-span-full';
  }
  return breakpoint ? `${breakpoint}:col-span-${span}` : `col-span-${span}`;
};

// Helper function to generate order classes
const getOrderClass = (order: number, breakpoint?: GridBreakpoint): string => {
  return breakpoint ? `${breakpoint}:order-${order}` : `order-${order}`;
};

// Grid Item Component
export function GridItem({
  children,
  span = 1,
  smSpan,
  mdSpan,
  lgSpan,
  xlSpan,
  order,
  smOrder,
  mdOrder,
  lgOrder,
  xlOrder,
  className
}: GridItemProps) {
  const spanClasses = [
    getSpanClass(span),
    smSpan && getSpanClass(smSpan, 'sm'),
    mdSpan && getSpanClass(mdSpan, 'md'),
    lgSpan && getSpanClass(lgSpan, 'lg'),
    xlSpan && getSpanClass(xlSpan, 'xl')
  ].filter(Boolean).join(' ');

  const orderClasses = [
    order && getOrderClass(order),
    smOrder && getOrderClass(smOrder, 'sm'),
    mdOrder && getOrderClass(mdOrder, 'md'),
    lgOrder && getOrderClass(lgOrder, 'lg'),
    xlOrder && getOrderClass(xlOrder, 'xl')
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(spanClasses, orderClasses, className)}>
      {children}
    </div>
  );
}

// Main Dashboard Grid Component
export function DashboardGrid({
  children,
  columns = 12,
  gap = 'md',
  compact = false,
  className
}: DashboardGridProps) {
  const gapClasses = compact ? compactSpacing.gap : responsiveSpacing.gap;
  const gapClass = gapClasses[gap];

  const gridCols = {
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    8: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8',
    12: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12'
  };

  return (
    <div className={cn(
      'grid',
      gridCols[columns],
      gapClass,
      className
    )}>
      {children}
    </div>
  );
}

// Predefined Layout Components
export function MetricsSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('mb-6 sm:mb-8', className)}>
      <DashboardGrid columns={4} gap="md">
        {children}
      </DashboardGrid>
    </section>
  );
}

export function ChartsSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('mb-6 sm:mb-8', className)}>
      <DashboardGrid columns={12} gap="md">
        {children}
      </DashboardGrid>
    </section>
  );
}

export function DetailsSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('mb-6 sm:mb-8', className)}>
      <DashboardGrid columns={12} gap="md">
        {children}
      </DashboardGrid>
    </section>
  );
}

// Layout Templates
export function TwoColumnLayout({ 
  left, 
  right, 
  leftSpan = 8, 
  rightSpan = 4,
  className 
}: { 
  left: React.ReactNode; 
  right: React.ReactNode; 
  leftSpan?: GridSpan;
  rightSpan?: GridSpan;
  className?: string;
}) {
  return (
    <DashboardGrid columns={12} gap="md" className={className}>
      <GridItem span={12} lgSpan={leftSpan}>
        {left}
      </GridItem>
      <GridItem span={12} lgSpan={rightSpan}>
        {right}
      </GridItem>
    </DashboardGrid>
  );
}

export function ThreeColumnLayout({ 
  left, 
  center, 
  right,
  leftSpan = 3,
  centerSpan = 6,
  rightSpan = 3,
  className 
}: { 
  left: React.ReactNode; 
  center: React.ReactNode; 
  right: React.ReactNode;
  leftSpan?: GridSpan;
  centerSpan?: GridSpan;
  rightSpan?: GridSpan;
  className?: string;
}) {
  return (
    <DashboardGrid columns={12} gap="md" className={className}>
      <GridItem span={12} lgSpan={leftSpan}>
        {left}
      </GridItem>
      <GridItem span={12} lgSpan={centerSpan}>
        {center}
      </GridItem>
      <GridItem span={12} lgSpan={rightSpan}>
        {right}
      </GridItem>
    </DashboardGrid>
  );
}

// Responsive Stack Component
export function ResponsiveStack({ 
  children, 
  direction = 'vertical',
  gap = 'md',
  breakpoint = 'md',
  className 
}: {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  gap?: 'sm' | 'md' | 'lg';
  breakpoint?: GridBreakpoint;
  className?: string;
}) {
  const gapClasses = responsiveSpacing.gap;
  const gapClass = gapClasses[gap];

  const directionClasses = {
    vertical: `flex flex-col ${breakpoint}:flex-row`,
    horizontal: `flex flex-row ${breakpoint}:flex-col`
  };

  return (
    <div className={cn(
      directionClasses[direction],
      gapClass,
      className
    )}>
      {children}
    </div>
  );
}

// Dashboard Section Wrapper
export function DashboardSection({
  title,
  subtitle,
  children,
  headerActions,
  className
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mb-6 sm:mb-8', className)}>
      {(title || subtitle || headerActions) && (
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div>
            {title && (
              <h2 className={dashboardDesign.hierarchy.secondary}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={cn(dashboardDesign.hierarchy.body, 'mt-1')}>
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

// Auto-sizing Grid for Cards
export function AutoGrid({ 
  children, 
  minWidth = 280,
  gap = 'md',
  className 
}: {
  children: React.ReactNode;
  minWidth?: number;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const gapClasses = responsiveSpacing.gap;
  const gapClass = gapClasses[gap];

  return (
    <div 
      className={cn(
        'grid',
        gapClass,
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`
      }}
    >
      {children}
    </div>
  );
}

// Masonry-style Grid (CSS Grid)
export function MasonryGrid({ 
  children, 
  columns = 3,
  gap = 'md',
  className 
}: {
  children: React.ReactNode;
  columns?: number;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const gapClasses = responsiveSpacing.gap;
  const gapClass = gapClasses[gap];

  return (
    <div 
      className={cn(
        'grid',
        gapClass,
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: 'min-content'
      }}
    >
      {children}
    </div>
  );
}
