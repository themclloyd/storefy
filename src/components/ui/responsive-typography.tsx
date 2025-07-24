import React from 'react';
import { cn } from '@/lib/utils';
import { responsiveText } from '@/lib/responsive-utils';

// Responsive Heading Components
interface ResponsiveHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function ResponsiveH1({ children, className, as = 'h1' }: ResponsiveHeadingProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.h1, className)}>
      {children}
    </Component>
  );
}

export function ResponsiveH2({ children, className, as = 'h2' }: ResponsiveHeadingProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.h2, className)}>
      {children}
    </Component>
  );
}

export function ResponsiveH3({ children, className, as = 'h3' }: ResponsiveHeadingProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.h3, className)}>
      {children}
    </Component>
  );
}

export function ResponsiveH4({ children, className, as = 'h4' }: ResponsiveHeadingProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.h4, className)}>
      {children}
    </Component>
  );
}

export function ResponsiveH5({ children, className, as = 'h5' }: ResponsiveHeadingProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.h5, className)}>
      {children}
    </Component>
  );
}

export function ResponsiveH6({ children, className, as = 'h6' }: ResponsiveHeadingProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.h6, className)}>
      {children}
    </Component>
  );
}

// Responsive Text Components
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

export function ResponsiveBodyText({ children, className, as = 'p' }: ResponsiveTextProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.body, className)}>
      {children}
    </Component>
  );
}

export function ResponsiveBodyLarge({ children, className, as = 'p' }: ResponsiveTextProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.bodyLarge, className)}>
      {children}
    </Component>
  );
}

export function ResponsiveBodySmall({ children, className, as = 'p' }: ResponsiveTextProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.bodySmall, className)}>
      {children}
    </Component>
  );
}

export function ResponsiveCaption({ children, className, as = 'span' }: ResponsiveTextProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.caption, className)}>
      {children}
    </Component>
  );
}

export function ResponsiveLabel({ children, className, as = 'label' }: ResponsiveTextProps) {
  const Component = as;
  return (
    <Component className={cn(responsiveText.label, className)}>
      {children}
    </Component>
  );
}

// Responsive Container Components
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  padding?: boolean;
}

export function ResponsiveContainer({ 
  children, 
  className, 
  size = 'full',
  padding = true 
}: ResponsiveContainerProps) {
  const containerClasses = {
    sm: 'max-w-sm mx-auto',
    md: 'max-w-md mx-auto',
    lg: 'max-w-lg mx-auto',
    xl: 'max-w-xl mx-auto',
    '2xl': 'max-w-2xl mx-auto',
    '3xl': 'max-w-3xl mx-auto',
    '4xl': 'max-w-4xl mx-auto',
    '5xl': 'max-w-5xl mx-auto',
    '6xl': 'max-w-6xl mx-auto',
    '7xl': 'max-w-7xl mx-auto',
    full: 'w-full'
  };

  const paddingClasses = padding ? 'px-4 sm:px-6 lg:px-8' : '';

  return (
    <div className={cn(containerClasses[size], paddingClasses, className)}>
      {children}
    </div>
  );
}

// Responsive Section Component
interface ResponsiveSectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'muted' | 'card';
}

export function ResponsiveSection({ 
  children, 
  className, 
  spacing = 'md',
  background = 'default'
}: ResponsiveSectionProps) {
  const spacingClasses = {
    xs: 'py-4 sm:py-6',
    sm: 'py-6 sm:py-8',
    md: 'py-8 sm:py-12',
    lg: 'py-12 sm:py-16',
    xl: 'py-16 sm:py-20'
  };

  const backgroundClasses = {
    default: '',
    muted: 'bg-muted/50',
    card: 'bg-card'
  };

  return (
    <section className={cn(
      spacingClasses[spacing],
      backgroundClasses[background],
      className
    )}>
      {children}
    </section>
  );
}

// Responsive Card Component with enhanced spacing
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export function ResponsiveCard({ 
  children, 
  className, 
  padding = 'md',
  hover = false,
  clickable = false,
  onClick 
}: ResponsiveCardProps) {
  const paddingClasses = {
    xs: 'p-3 sm:p-4',
    sm: 'p-4 sm:p-6',
    md: 'p-6 sm:p-8',
    lg: 'p-8 sm:p-10',
    xl: 'p-10 sm:p-12'
  };

  return (
    <div
      className={cn(
        'bg-card border shadow-sm',
        paddingClasses[padding],
        hover && 'transition-shadow hover:shadow-md',
        clickable && 'cursor-pointer transition-colors hover:bg-muted/50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Responsive Spacing Component
interface ResponsiveSpacingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'vertical' | 'horizontal' | 'both';
}

export function ResponsiveSpacing({ size = 'md', direction = 'vertical' }: ResponsiveSpacingProps) {
  const spacingClasses = {
    vertical: {
      xs: 'h-2 sm:h-3',
      sm: 'h-3 sm:h-4',
      md: 'h-4 sm:h-6',
      lg: 'h-6 sm:h-8',
      xl: 'h-8 sm:h-12'
    },
    horizontal: {
      xs: 'w-2 sm:w-3',
      sm: 'w-3 sm:w-4',
      md: 'w-4 sm:w-6',
      lg: 'w-6 sm:w-8',
      xl: 'w-8 sm:w-12'
    },
    both: {
      xs: 'h-2 w-2 sm:h-3 sm:w-3',
      sm: 'h-3 w-3 sm:h-4 sm:w-4',
      md: 'h-4 w-4 sm:h-6 sm:w-6',
      lg: 'h-6 w-6 sm:h-8 sm:w-8',
      xl: 'h-8 w-8 sm:h-12 sm:w-12'
    }
  };

  return <div className={spacingClasses[direction][size]} />;
}

// Responsive Divider Component
interface ResponsiveDividerProps {
  className?: string;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  orientation?: 'horizontal' | 'vertical';
}

export function ResponsiveDivider({ 
  className, 
  spacing = 'md', 
  orientation = 'horizontal' 
}: ResponsiveDividerProps) {
  const spacingClasses = {
    xs: 'my-2 sm:my-3',
    sm: 'my-3 sm:my-4',
    md: 'my-4 sm:my-6',
    lg: 'my-6 sm:my-8',
    xl: 'my-8 sm:my-12'
  };

  const orientationClasses = {
    horizontal: 'w-full h-px',
    vertical: 'h-full w-px'
  };

  return (
    <div 
      className={cn(
        'bg-border',
        orientationClasses[orientation],
        orientation === 'horizontal' && spacingClasses[spacing],
        className
      )} 
    />
  );
}
