import React, { createContext, useContext, useState, useCallback } from 'react';

export interface NavigationItem {
  id: string;
  title: string;
  component: React.ComponentType;
  data?: any;
  canGoBack?: boolean;
}

interface NavigationContextType {
  currentView: NavigationItem | null;
  navigationStack: NavigationItem[];
  navigateTo: (item: NavigationItem) => void;
  goBack: () => void;
  canGoBack: boolean;
  isTransitioning: boolean;
  transitionDirection: 'forward' | 'backward' | null;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

interface NavigationProviderProps {
  children: React.ReactNode;
  initialView: NavigationItem;
}

export function NavigationProvider({ children, initialView }: NavigationProviderProps) {
  const [navigationStack, setNavigationStack] = useState<NavigationItem[]>([initialView]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward' | null>(null);

  const currentView = navigationStack[navigationStack.length - 1] || null;
  const canGoBack = navigationStack.length > 1;

  const navigateTo = useCallback((item: NavigationItem) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setTransitionDirection('forward');

    // Add transition delay to allow animation
    setTimeout(() => {
      setNavigationStack(prev => [...prev, item]);
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionDirection(null);
      }, 300); // Match CSS transition duration
    }, 50);
  }, [isTransitioning]);

  const goBack = useCallback(() => {
    if (!canGoBack || isTransitioning) return;

    setIsTransitioning(true);
    setTransitionDirection('backward');

    // Add transition delay to allow animation
    setTimeout(() => {
      setNavigationStack(prev => prev.slice(0, -1));
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionDirection(null);
      }, 300); // Match CSS transition duration
    }, 50);
  }, [canGoBack, isTransitioning]);

  const value: NavigationContextType = {
    currentView,
    navigationStack,
    navigateTo,
    goBack,
    canGoBack,
    isTransitioning,
    transitionDirection,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
