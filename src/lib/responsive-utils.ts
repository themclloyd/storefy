import { cn } from "@/lib/utils"

// Responsive breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  sm: 640,   // Small devices (landscape phones)
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (desktops)
  xl: 1280,  // Extra large devices
  '2xl': 1536 // 2X Extra large devices
} as const

// Responsive spacing utilities
export const responsiveSpacing = {
  // Padding classes
  padding: {
    xs: "p-2 sm:p-3 md:p-4",
    sm: "p-3 sm:p-4 md:p-6", 
    md: "p-4 sm:p-6 md:p-8",
    lg: "p-6 sm:p-8 md:p-10",
    xl: "p-8 sm:p-10 md:p-12"
  },
  // Margin classes
  margin: {
    xs: "m-2 sm:m-3 md:m-4",
    sm: "m-3 sm:m-4 md:m-6",
    md: "m-4 sm:m-6 md:m-8", 
    lg: "m-6 sm:m-8 md:m-10",
    xl: "m-8 sm:m-10 md:m-12"
  },
  // Gap classes for flex/grid
  gap: {
    xs: "gap-2 sm:gap-3 md:gap-4",
    sm: "gap-3 sm:gap-4 md:gap-6",
    md: "gap-4 sm:gap-6 md:gap-8",
    lg: "gap-6 sm:gap-8 md:gap-10",
    xl: "gap-8 sm:gap-10 md:gap-12"
  }
}

// Responsive typography utilities
export const responsiveText = {
  // Heading sizes - Made lighter
  h1: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light",
  h2: "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light",
  h3: "text-lg sm:text-xl md:text-2xl lg:text-3xl font-normal",
  h4: "text-base sm:text-lg md:text-xl lg:text-2xl font-normal",
  h5: "text-sm sm:text-base md:text-lg lg:text-xl font-normal",
  h6: "text-xs sm:text-sm md:text-base lg:text-lg font-normal",
  
  // Body text sizes
  body: "text-sm sm:text-base",
  bodyLarge: "text-base sm:text-lg",
  bodySmall: "text-xs sm:text-sm",
  
  // Special text
  caption: "text-xs sm:text-sm text-muted-foreground",
  label: "text-xs sm:text-sm font-medium",
  button: "text-sm sm:text-base font-medium"
}

// Responsive grid utilities
export const responsiveGrid = {
  // Common grid patterns
  auto: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  cards: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  products: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  stats: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  dashboard: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  
  // Specific layouts
  sidebar: "grid grid-cols-1 lg:grid-cols-[280px_1fr]",
  content: "grid grid-cols-1 lg:grid-cols-[1fr_300px]",
  split: "grid grid-cols-1 md:grid-cols-2",
  thirds: "grid grid-cols-1 md:grid-cols-3"
}

// Responsive container utilities
export const responsiveContainer = {
  // Max widths
  sm: "max-w-sm mx-auto px-4 sm:px-6",
  md: "max-w-md mx-auto px-4 sm:px-6",
  lg: "max-w-lg mx-auto px-4 sm:px-6",
  xl: "max-w-xl mx-auto px-4 sm:px-6",
  "2xl": "max-w-2xl mx-auto px-4 sm:px-6",
  "3xl": "max-w-3xl mx-auto px-4 sm:px-6",
  "4xl": "max-w-4xl mx-auto px-4 sm:px-6",
  "5xl": "max-w-5xl mx-auto px-4 sm:px-6",
  "6xl": "max-w-6xl mx-auto px-4 sm:px-6",
  "7xl": "max-w-7xl mx-auto px-4 sm:px-6",
  full: "w-full px-4 sm:px-6 lg:px-8"
}

// Compact layout utilities - constrained widths for better readability
export const compactContainer = {
  // Compact max widths - prevents content from being too wide
  sm: "max-w-sm mx-auto px-3 sm:px-4",
  md: "max-w-md mx-auto px-3 sm:px-4",
  lg: "max-w-2xl mx-auto px-3 sm:px-4",
  xl: "max-w-4xl mx-auto px-3 sm:px-4",
  "2xl": "max-w-5xl mx-auto px-3 sm:px-4",
  "3xl": "max-w-6xl mx-3 sm:px-4",
  content: "max-w-4xl mx-auto px-3 sm:px-4", // Default content width
  wide: "max-w-6xl mx-auto px-3 sm:px-4", // For wider content like tables
  narrow: "max-w-2xl mx-auto px-3 sm:px-4" // For forms and narrow content
}

// Compact spacing - balanced spacing for compact mode
export const compactSpacing = {
  // Padding classes - balanced reduction
  padding: {
    xs: "p-2 sm:p-3",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-5",
    lg: "p-5 sm:p-6",
    xl: "p-6 sm:p-7"
  },
  // Margin classes - balanced reduction
  margin: {
    xs: "m-2 sm:m-3",
    sm: "m-3 sm:m-4",
    md: "m-4 sm:m-5",
    lg: "m-5 sm:m-6",
    xl: "m-6 sm:m-7"
  },
  // Gap classes for flex/grid - balanced reduction
  gap: {
    xs: "gap-2 sm:gap-3",
    sm: "gap-3 sm:gap-4",
    md: "gap-4 sm:gap-5",
    lg: "gap-5 sm:gap-6",
    xl: "gap-6 sm:gap-7"
  }
}

// Responsive button utilities
export const responsiveButton = {
  // Size variants
  xs: "h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm",
  sm: "h-9 px-3 text-sm sm:h-10 sm:px-4",
  md: "h-10 px-4 text-sm sm:h-11 sm:px-6 sm:text-base",
  lg: "h-11 px-6 text-base sm:h-12 sm:px-8 sm:text-lg",
  xl: "h-12 px-8 text-lg sm:h-14 sm:px-10 sm:text-xl",
  
  // Icon button sizes
  iconXs: "h-8 w-8 sm:h-9 sm:w-9",
  iconSm: "h-9 w-9 sm:h-10 sm:w-10", 
  iconMd: "h-10 w-10 sm:h-11 sm:w-11",
  iconLg: "h-11 w-11 sm:h-12 sm:w-12",
  iconXl: "h-12 w-12 sm:h-14 sm:w-14"
}

// Responsive card utilities
export const responsiveCard = {
  // Padding variants
  xs: "p-3 sm:p-4",
  sm: "p-4 sm:p-6",
  md: "p-6 sm:p-8", 
  lg: "p-8 sm:p-10",
  xl: "p-10 sm:p-12",
  
  // Header padding
  headerXs: "px-3 py-2 sm:px-4 sm:py-3",
  headerSm: "px-4 py-3 sm:px-6 sm:py-4",
  headerMd: "px-6 py-4 sm:px-8 sm:py-6",
  
  // Content padding
  contentXs: "px-3 pb-3 sm:px-4 sm:pb-4",
  contentSm: "px-4 pb-4 sm:px-6 sm:pb-6",
  contentMd: "px-6 pb-6 sm:px-8 sm:pb-8"
}

// Responsive icon utilities
export const responsiveIcon = {
  xs: "h-3 w-3 sm:h-4 sm:w-4",
  sm: "h-4 w-4 sm:h-5 sm:w-5",
  md: "h-5 w-5 sm:h-6 sm:w-6",
  lg: "h-6 w-6 sm:h-7 sm:w-7",
  xl: "h-7 w-7 sm:h-8 sm:w-8",
  "2xl": "h-8 w-8 sm:h-10 sm:w-10"
}

// Helper function to build responsive classes
export function buildResponsiveClass(
  base: string,
  responsive: Record<string, string> = {}
): string {
  const classes = [base]
  
  Object.entries(responsive).forEach(([breakpoint, value]) => {
    if (breakpoint === 'default') return
    classes.push(`${breakpoint}:${value}`)
  })
  
  return cn(...classes)
}

// Helper function for responsive values
export function getResponsiveValue<T>(
  values: Partial<Record<'mobile' | 'tablet' | 'desktop' | 'default', T>>,
  screenSize: { isMobile: boolean; isTablet: boolean; isDesktop: boolean }
): T {
  if (screenSize.isMobile && values.mobile !== undefined) return values.mobile
  if (screenSize.isTablet && values.tablet !== undefined) return values.tablet  
  if (screenSize.isDesktop && values.desktop !== undefined) return values.desktop
  
  return values.default as T
}

// Responsive layout patterns
export const layoutPatterns = {
  // Stack on mobile, side-by-side on desktop
  stack: "flex flex-col md:flex-row",
  stackReverse: "flex flex-col-reverse md:flex-row",
  
  // Center content
  center: "flex items-center justify-center",
  centerVertical: "flex items-center",
  centerHorizontal: "flex justify-center",
  
  // Space between
  spaceBetween: "flex items-center justify-between",
  spaceAround: "flex items-center justify-around",
  
  // Responsive flex
  flexWrap: "flex flex-wrap",
  flexNoWrap: "flex flex-nowrap",
  
  // Hide/show at breakpoints
  hideOnMobile: "hidden sm:block",
  hideOnTablet: "block sm:hidden md:block",
  hideOnDesktop: "block lg:hidden",
  showOnMobile: "block sm:hidden",
  showOnTablet: "hidden sm:block md:hidden",
  showOnDesktop: "hidden lg:block"
}

// Touch-friendly utilities for mobile
export const touchFriendly = {
  // Minimum touch target sizes
  minTouch: "min-h-[44px] min-w-[44px]", // iOS guidelines
  touchTarget: "h-11 w-11 sm:h-10 sm:w-10", // Larger on mobile

  // Touch-friendly spacing
  touchSpacing: "space-y-3 sm:space-y-2",
  touchGap: "gap-3 sm:gap-2",

  // Touch-friendly padding
  touchPadding: "p-3 sm:p-2",
  touchPaddingX: "px-4 sm:px-3",
  touchPaddingY: "py-3 sm:py-2"
}

// Modern Dashboard Design System (2025)
export const dashboardDesign = {
  // Visual hierarchy levels
  hierarchy: {
    primary: "text-2xl sm:text-3xl font-bold text-foreground",
    secondary: "text-lg sm:text-xl font-semibold text-foreground",
    tertiary: "text-base sm:text-lg font-medium text-foreground",
    body: "text-sm sm:text-base text-muted-foreground",
    caption: "text-xs sm:text-sm text-muted-foreground"
  },

  // Modern card designs
  cards: {
    // Elevated cards with subtle shadows
    elevated: "bg-card border border-border/50 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200",
    // Flat cards with borders
    flat: "bg-card border border-border rounded-lg",
    // Glass morphism effect
    glass: "bg-card/80 backdrop-blur-sm border border-border/30 rounded-xl",
    // Metric cards with emphasis
    metric: "bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200",
    // Interactive cards
    interactive: "bg-card border border-border/50 rounded-xl shadow-sm hover:shadow-md hover:border-border transition-all duration-200 cursor-pointer"
  },

  // Color system for data visualization
  colors: {
    // Primary data colors
    primary: "hsl(var(--primary))",
    success: "hsl(142 76% 36%)",
    warning: "hsl(38 92% 50%)",
    danger: "hsl(0 84% 60%)",
    info: "hsl(217 91% 60%)",

    // Chart color palette
    chart: [
      "hsl(var(--primary))",
      "hsl(142 76% 36%)",
      "hsl(38 92% 50%)",
      "hsl(217 91% 60%)",
      "hsl(280 100% 70%)",
      "hsl(16 100% 66%)"
    ],

    // Gradient backgrounds
    gradients: {
      primary: "bg-gradient-to-br from-primary/10 to-primary/5",
      success: "bg-gradient-to-br from-green-500/10 to-green-500/5",
      warning: "bg-gradient-to-br from-yellow-500/10 to-yellow-500/5",
      danger: "bg-gradient-to-br from-red-500/10 to-red-500/5"
    }
  },

  // Animation and transitions
  animations: {
    // Smooth transitions
    smooth: "transition-all duration-200 ease-in-out",
    fast: "transition-all duration-150 ease-in-out",
    slow: "transition-all duration-300 ease-in-out",

    // Hover effects
    hover: "hover:scale-[1.02] transition-transform duration-200",
    hoverSoft: "hover:bg-muted/50 transition-colors duration-200",

    // Loading states
    pulse: "animate-pulse",
    bounce: "animate-bounce",
    spin: "animate-spin"
  },

  // Layout patterns for dashboard
  layouts: {
    // Main dashboard grid
    main: "grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6",
    // Metrics grid
    metrics: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6",
    // Chart section
    charts: "grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6",
    // Sidebar layout
    sidebar: "grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 sm:gap-6",
    // Full width sections
    fullWidth: "col-span-full"
  },

  // Interactive elements
  interactive: {
    // Buttons with modern styling
    button: "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    // Icon buttons
    iconButton: "inline-flex items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    // Links
    link: "text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
  }
}
