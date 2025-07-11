import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/contexts/NavigationContext';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightActions?: React.ReactNode;
  searchable?: boolean;
  onSearchPress?: () => void;
  className?: string;
  variant?: 'default' | 'transparent' | 'elevated';
}

export function AppHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightActions,
  searchable = false,
  onSearchPress,
  className,
  variant = 'default'
}: AppHeaderProps) {
  // Try to use navigation context, but don't require it
  let goBack, canGoBack;
  try {
    const navigation = useNavigation();
    goBack = navigation.goBack;
    canGoBack = navigation.canGoBack;
  } catch {
    // Navigation context not available, use defaults
    goBack = () => window.history.back();
    canGoBack = false;
  }

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (canGoBack) {
      goBack();
    }
  };

  const shouldShowBackButton = showBackButton || (canGoBack && !onBackPress);

  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b transition-all duration-200",
        variant === 'default' && "bg-background border-border",
        variant === 'transparent' && "bg-transparent border-transparent",
        variant === 'elevated' && "bg-background border-border shadow-sm",
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {shouldShowBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackPress}
            className="p-2 h-auto hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {searchable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearchPress}
            className="p-2 h-auto hover:bg-muted/50 transition-colors"
          >
            <Search className="w-5 h-5" />
          </Button>
        )}
        
        {rightActions}
      </div>
    </header>
  );
}

interface HeaderActionProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  label?: string;
  variant?: 'ghost' | 'default';
}

export function HeaderAction({ icon: Icon, onClick, label, variant = 'ghost' }: HeaderActionProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      className="p-2 h-auto hover:bg-muted/50 transition-colors"
      title={label}
    >
      <Icon className="w-5 h-5" />
    </Button>
  );
}

interface HeaderMenuProps {
  children: React.ReactNode;
}

export function HeaderMenu({ children }: HeaderMenuProps) {
  return (
    <div className="flex items-center gap-1">
      {children}
      <Button
        variant="ghost"
        size="sm"
        className="p-2 h-auto hover:bg-muted/50 transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </Button>
    </div>
  );
}
