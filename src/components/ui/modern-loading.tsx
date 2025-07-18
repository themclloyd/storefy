import React from 'react';
import { Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Modern unified loading component with consistent theming
interface ModernLoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  text?: string;
  className?: string;
  fullScreen?: boolean;
  showLogo?: boolean;
}

export function ModernLoading({
  size = 'md',
  variant = 'spinner',
  text,
  className,
  fullScreen = false,
  showLogo = false,
}: ModernLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-background'
    : 'flex items-center justify-center p-4';

  const LoadingSpinner = () => (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
  );

  const LoadingDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-primary rounded-full animate-pulse',
            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );

  const LoadingPulse = () => (
    <div className={cn('bg-primary/20 rounded-full animate-pulse', sizeClasses[size])} />
  );

  const LoadingSkeleton = () => (
    <div className="space-y-2 w-full max-w-sm">
      <div className="h-4 bg-muted animate-pulse rounded" />
      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
      <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
    </div>
  );

  const renderLoading = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots />;
      case 'pulse':
        return <LoadingPulse />;
      case 'skeleton':
        return <LoadingSkeleton />;
      case 'spinner':
      default:
        return <LoadingSpinner />;
    }
  };

  return (
    <div className={cn(containerClasses, className)}>
      <div className="text-center space-y-4">
        {showLogo && (
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
        )}
        
        {renderLoading()}
        
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

// Page-level loading component
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <ModernLoading
      size="lg"
      variant="spinner"
      text={text}
      fullScreen
      showLogo
    />
  );
}

// Inline loading component
export function InlineLoading({ text, size = 'md' }: { text?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <ModernLoading
      size={size}
      variant="spinner"
      text={text}
      className="py-8"
    />
  );
}

// Button loading state
export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <ModernLoading
      size={size}
      variant="spinner"
      className="p-0"
    />
  );
}

// Card loading state
export function CardLoading({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted animate-pulse rounded"
          style={{ width: `${100 - (i * 10)}%` }}
        />
      ))}
    </div>
  );
}

// Table loading state
export function TableLoading({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-muted animate-pulse rounded" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-muted/60 animate-pulse rounded"
              style={{ animationDelay: `${(rowIndex * columns + colIndex) * 0.1}s` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading overlay for existing content
export function LoadingOverlay({ children, loading, text }: {
  children: React.ReactNode;
  loading: boolean;
  text?: string;
}) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <ModernLoading
            size="lg"
            variant="spinner"
            text={text}
            className="bg-card border rounded-lg shadow-lg p-6"
          />
        </div>
      )}
    </div>
  );
}

// Hook for consistent loading states
export function useModernLoading(initialState = false) {
  const [loading, setLoading] = React.useState(initialState);

  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);
  const toggleLoading = () => setLoading(prev => !prev);

  return {
    loading,
    startLoading,
    stopLoading,
    toggleLoading,
    LoadingComponent: ({ text, variant = 'spinner' }: { text?: string; variant?: 'spinner' | 'dots' | 'pulse' }) => (
      loading ? <ModernLoading variant={variant} text={text} /> : null
    ),
  };
}
