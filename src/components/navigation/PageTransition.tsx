import React from 'react';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/contexts/NavigationContext';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  // Try to use navigation context, but don't require it
  let isTransitioning, transitionDirection;
  try {
    const navigation = useNavigation();
    isTransitioning = navigation.isTransitioning;
    transitionDirection = navigation.transitionDirection;
  } catch {
    // Navigation context not available, use defaults
    isTransitioning = false;
    transitionDirection = null;
  }

  return (
    <div 
      className={cn(
        "relative w-full h-full overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "w-full h-full transition-transform duration-300 ease-out",
          isTransitioning && transitionDirection === 'forward' && "transform translate-x-full",
          isTransitioning && transitionDirection === 'backward' && "transform -translate-x-full",
          !isTransitioning && "transform translate-x-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface SlideTransitionProps {
  isVisible: boolean;
  direction: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

export function SlideTransition({ isVisible, direction, children, className }: SlideTransitionProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 transition-transform duration-300 ease-out",
        isVisible ? "transform translate-x-0" : 
        direction === 'left' ? "transform -translate-x-full" : "transform translate-x-full",
        className
      )}
    >
      {children}
    </div>
  );
}

interface FadeTransitionProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FadeTransition({ isVisible, children, className, delay = 0 }: FadeTransitionProps) {
  return (
    <div
      className={cn(
        "transition-opacity duration-300 ease-out",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

interface ScaleTransitionProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ScaleTransition({ isVisible, children, className }: ScaleTransitionProps) {
  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out origin-center",
        isVisible ? "transform scale-100 opacity-100" : "transform scale-95 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
