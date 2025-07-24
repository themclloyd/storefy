/**
 * STOREFY THEME SYSTEM
 * Centralized theme configuration for consistent design across the application
 */

// Core theme colors based on CSS variables - Neutral Theme
export const themeColors = {
  // Primary colors
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },

  // Secondary colors
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },

  // Neutral colors
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },

  // Card colors
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },

  // Status colors
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
  },

  // Interactive elements
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },

  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',

  // Chart colors
  chart: {
    1: 'hsl(var(--chart-1))',
    2: 'hsl(var(--chart-2))',
    3: 'hsl(var(--chart-3))',
    4: 'hsl(var(--chart-4))',
    5: 'hsl(var(--chart-5))',
  },
} as const;

// Typography system
export const typography = {
  fontFamily: {
    sans: ['Lexend Deca', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

// Spacing system
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
} as const;

// Border radius system - Square Design (No radius except buttons and badges)
export const borderRadius = {
  none: '0',
  DEFAULT: '0',     // Square by default
  sm: '0',          // Square
  md: '0',          // Square
  lg: '0',          // Square
  xl: '0',          // Square
  '2xl': '0',       // Square
  '3xl': '0',       // Square
  '4xl': '0',       // Square
  button: '9999px', // Fully rounded buttons
  badge: '9999px',  // Fully rounded badges
  full: '9999px',   // Fully rounded when explicitly needed
} as const;

// Shadow system
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
} as const;

// Component variants - Neutral Theme
export const componentVariants = {
  button: {
    primary: 'btn-gradient rounded-md',
    gradient: 'btn-gradient rounded-md',
    solid: 'bg-primary hover:bg-primary/90 text-primary-foreground rounded-md',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-md',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md',
    outline: 'border border-border bg-background hover:bg-accent text-foreground rounded-md',
    ghost: 'hover:bg-accent text-foreground rounded-md',
  },

  card: {
    default: 'bg-card border border-border rounded-lg',
    elevated: 'bg-card border border-border shadow-sm rounded-lg',
    interactive: 'bg-card border border-border hover:bg-accent/50 transition-colors rounded-lg',
  },

  badge: {
    primary: 'bg-primary/10 text-primary border-primary/20 rounded-md',
    secondary: 'bg-secondary/10 text-secondary-foreground border-secondary/20 rounded-md',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20 rounded-md',
    muted: 'bg-muted text-muted-foreground border-border rounded-md',
  },
} as const;

// Animation system
export const animations = {
  transition: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Theme configuration object
export const theme = {
  colors: themeColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  componentVariants,
  animations,
  breakpoints,
} as const;

export type Theme = typeof theme;
export type ThemeColors = typeof themeColors;
export type ComponentVariants = typeof componentVariants;
