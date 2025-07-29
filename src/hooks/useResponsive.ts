import { useState, useEffect } from 'react';

interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isXLarge: boolean;
}

/**
 * Hook to get responsive screen size information
 */
export function useResponsive(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    // Safe default for SSR
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isSmall: false,
        isMedium: false,
        isLarge: true,
        isXLarge: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isSmall: width < 640,
      isMedium: width >= 640 && width < 1024,
      isLarge: width >= 1024 && width < 1280,
      isXLarge: width >= 1280,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isSmall: width < 640,
        isMedium: width >= 640 && width < 1024,
        isLarge: width >= 1024 && width < 1280,
        isXLarge: width >= 1280,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

/**
 * Hook to get responsive chart configuration
 */
export function useResponsiveChart() {
  const { isMobile, isTablet } = useResponsive();

  return {
    margin: {
      top: 10,
      right: isMobile ? 5 : 10,
      left: isMobile ? 5 : 0,
      bottom: 0,
    },
    fontSize: isMobile ? 10 : 12,
    strokeWidth: isMobile ? 1.5 : 2,
    yAxisWidth: isMobile ? 40 : 60,
    tickInterval: isMobile ? 1 : 0,
    showGrid: !isMobile,
  };
}

/**
 * Hook to get responsive grid columns
 */
export function useResponsiveGrid(options: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
  default?: number;
}) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (isMobile && options.mobile) return options.mobile;
  if (isTablet && options.tablet) return options.tablet;
  if (isDesktop && options.desktop) return options.desktop;
  return options.default || 1;
}
