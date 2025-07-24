import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive';
}

export function FloatingActionButton({
  onClick,
  icon: Icon = Plus,
  label,
  size = 'md',
  position = 'bottom-right',
  className,
  variant = 'default'
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed z-50 rounded-badge shadow-lg hover:shadow-xl transition-all duration-200",
        "app-button active:scale-95",
        // Size variants
        size === 'sm' && "w-12 h-12 p-0",
        size === 'md' && "w-14 h-14 p-0",
        size === 'lg' && "w-16 h-16 p-0",
        // Position variants
        position === 'bottom-right' && "bottom-6 right-6",
        position === 'bottom-left' && "bottom-6 left-6",
        position === 'bottom-center' && "bottom-6 left-1/2 transform -translate-x-1/2",
        // Color variants
        variant === 'default' && "btn-gradient",
        variant === 'secondary' && "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
        variant === 'destructive' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
        className
      )}
      title={label}
    >
      <Icon className={cn(
        size === 'sm' && "w-5 h-5",
        size === 'md' && "w-6 h-6",
        size === 'lg' && "w-7 h-7"
      )} />
    </Button>
  );
}

interface ExtendedFABProps extends FloatingActionButtonProps {
  text: string;
  expanded?: boolean;
}

export function ExtendedFloatingActionButton({
  onClick,
  icon: Icon = Plus,
  text,
  expanded = false,
  size = 'md',
  position = 'bottom-right',
  className,
  variant = 'default'
}: ExtendedFABProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
        "app-button active:scale-95 flex items-center gap-2",
        // Size variants
        size === 'sm' && "h-12 px-4",
        size === 'md' && "h-14 px-5",
        size === 'lg' && "h-16 px-6",
        // Position variants
        position === 'bottom-right' && "bottom-6 right-6",
        position === 'bottom-left' && "bottom-6 left-6",
        position === 'bottom-center' && "bottom-6 left-1/2 transform -translate-x-1/2",
        // Color variants
        variant === 'default' && "bg-primary hover:bg-primary/90 text-primary-foreground",
        variant === 'secondary' && "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
        variant === 'destructive' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
        className
      )}
    >
      <Icon className={cn(
        size === 'sm' && "w-5 h-5",
        size === 'md' && "w-6 h-6",
        size === 'lg' && "w-7 h-7"
      )} />
      <span className={cn(
        "font-medium transition-all duration-300",
        expanded ? "opacity-100 max-w-xs" : "opacity-0 max-w-0 overflow-hidden",
        size === 'sm' && "text-sm",
        size === 'md' && "text-base",
        size === 'lg' && "text-lg"
      )}>
        {text}
      </span>
    </Button>
  );
}

interface FABGroupProps {
  mainAction: {
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    label?: string;
  };
  actions: Array<{
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  position?: 'bottom-right' | 'bottom-left';
}

export function FloatingActionButtonGroup({
  mainAction,
  actions,
  isOpen,
  onToggle,
  position = 'bottom-right'
}: FABGroupProps) {
  return (
    <div className={cn(
      "fixed z-50 flex flex-col-reverse gap-3",
      position === 'bottom-right' && "bottom-6 right-6",
      position === 'bottom-left' && "bottom-6 left-6"
    )}>
      {/* Secondary Actions */}
      {actions.map((action, index) => (
        <div
          key={index}
          className={cn(
            "transition-all duration-300 ease-out",
            isOpen 
              ? "opacity-100 transform translate-y-0" 
              : "opacity-0 transform translate-y-4 pointer-events-none"
          )}
          style={{ transitionDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center gap-3">
            {position === 'bottom-right' && (
              <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-md">
                <span className="text-sm font-medium">{action.label}</span>
              </div>
            )}
            <Button
              onClick={action.onClick}
              className="w-12 h-12 p-0 rounded-full shadow-lg bg-background hover:bg-muted border app-button"
            >
              <action.icon className="w-5 h-5" />
            </Button>
            {position === 'bottom-left' && (
              <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-md">
                <span className="text-sm font-medium">{action.label}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Main Action Button */}
      <FloatingActionButton
        onClick={onToggle}
        icon={mainAction.icon}
        label={mainAction.label}
        className={cn(
          "transition-transform duration-200",
          isOpen && "rotate-45"
        )}
      />
    </div>
  );
}
