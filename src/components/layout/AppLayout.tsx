import React from 'react';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/navigation/AppHeader';
import { PageTransition } from '@/components/navigation/PageTransition';

interface AppLayoutProps {
  children: React.ReactNode;
  header?: {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    rightActions?: React.ReactNode;
    searchable?: boolean;
    onSearchPress?: () => void;
    variant?: 'default' | 'transparent' | 'elevated';
  };
  className?: string;
  contentClassName?: string;
  fullScreen?: boolean;
  padding?: boolean;
}

export function AppLayout({
  children,
  header,
  className,
  contentClassName,
  fullScreen = false,
  padding = true
}: AppLayoutProps) {
  return (
    <div className={cn(
      "flex flex-col h-full bg-background",
      fullScreen && "h-screen",
      className
    )}>
      {/* Header */}
      {header && (
        <AppHeader
          title={header.title}
          subtitle={header.subtitle}
          showBackButton={header.showBackButton}
          onBackPress={header.onBackPress}
          rightActions={header.rightActions}
          searchable={header.searchable}
          onSearchPress={header.onSearchPress}
          variant={header.variant}
        />
      )}

      {/* Content */}
      <main className={cn(
        "flex-1 overflow-hidden",
        contentClassName
      )}>
        <PageTransition>
          <div className={cn(
            "h-full overflow-y-auto",
            padding && "p-4",
            !padding && "p-0"
          )}>
            {children}
          </div>
        </PageTransition>
      </main>
    </div>
  );
}

interface AppScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightActions?: React.ReactNode;
  searchable?: boolean;
  onSearchPress?: () => void;
  className?: string;
  contentClassName?: string;
  headerVariant?: 'default' | 'transparent' | 'elevated';
  padding?: boolean;
}

export function AppScreen({
  title,
  subtitle,
  children,
  rightActions,
  searchable,
  onSearchPress,
  className,
  contentClassName,
  headerVariant = 'default',
  padding = true
}: AppScreenProps) {
  return (
    <AppLayout
      header={{
        title,
        subtitle,
        rightActions,
        searchable,
        onSearchPress,
        variant: headerVariant
      }}
      className={className}
      contentClassName={contentClassName}
      padding={padding}
      fullScreen
    >
      {children}
    </AppLayout>
  );
}

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function AppModal({ isOpen, onClose, title, children, size = 'md' }: AppModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative bg-background rounded-t-xl sm:rounded-xl border shadow-xl",
        "w-full sm:w-auto sm:max-w-md",
        "max-h-[90vh] overflow-hidden",
        "animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4",
        "duration-300 ease-out",
        size === 'sm' && "sm:max-w-sm",
        size === 'md' && "sm:max-w-md",
        size === 'lg' && "sm:max-w-lg",
        size === 'xl' && "sm:max-w-xl",
        size === 'full' && "sm:max-w-4xl"
      )}>
        <AppHeader
          title={title}
          showBackButton
          onBackPress={onClose}
          variant="elevated"
        />
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}
