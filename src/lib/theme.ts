/**
 * STOREFY THEME SYSTEM
 * Centralized theme configuration for consistent design across the application
 */

// Core theme colors based on CSS variables - PayPal Inspired
export const themeColors = {
  // Primary brand colors - PayPal Blue
  primary: {
    DEFAULT: 'hsl(var(--primary))', // #0070BA PayPal Blue
    foreground: 'hsl(var(--primary-foreground))',
    dark: 'hsl(var(--primary-dark))',
    light: 'hsl(var(--primary-light))',
    accent: 'hsl(var(--primary-accent))',
  },

  // Secondary brand colors - Clean Gray
  secondary: {
    DEFAULT: 'hsl(var(--secondary))', // #F5F7FA Light Gray
    foreground: 'hsl(var(--secondary-foreground))',
    dark: 'hsl(var(--secondary-dark))',
    light: 'hsl(var(--secondary-light))',
  },
  
  // Tertiary colors
  tertiary: {
    DEFAULT: 'hsl(var(--tertiary))', // #10B981
    foreground: 'hsl(var(--tertiary-foreground))',
  },
  
  quaternary: {
    DEFAULT: 'hsl(var(--quaternary))', // #F59E0B
    foreground: 'hsl(var(--quaternary-foreground))',
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
    border: 'hsl(var(--card-border))',
    hover: 'hsl(var(--card-hover))',
  },
  
  // Status colors
  success: {
    DEFAULT: 'hsl(var(--success))',
    foreground: 'hsl(var(--success-foreground))',
    light: 'hsl(var(--success-light))',
  },
  
  warning: {
    DEFAULT: 'hsl(var(--warning))',
    foreground: 'hsl(var(--warning-foreground))',
    light: 'hsl(var(--warning-light))',
  },
  
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
    light: 'hsl(var(--destructive-light))',
  },
  
  info: {
    DEFAULT: 'hsl(var(--info))',
    foreground: 'hsl(var(--info-foreground))',
    light: 'hsl(var(--info-light))',
  },
} as const;

// Typography system
export const typography = {
  fontFamily: {
    sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
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

// Border radius system - PayPal Style
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  DEFAULT: '0.375rem', // 6px - PayPal standard
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  '4xl': '2.5rem',  // 40px
  full: '9999px',   // Fully rounded - PayPal buttons
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

// Component variants - PayPal Style
export const componentVariants = {
  button: {
    primary: 'bg-primary hover:bg-primary-dark text-primary-foreground rounded-full shadow-soft',
    secondary: 'bg-secondary hover:bg-secondary-dark text-secondary-foreground border border-border rounded-full shadow-soft',
    success: 'bg-success hover:bg-success/90 text-success-foreground rounded-full shadow-soft',
    warning: 'bg-warning hover:bg-warning/90 text-warning-foreground rounded-full shadow-soft',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full shadow-soft',
    outline: 'border border-border bg-background hover:bg-muted text-foreground rounded-full shadow-soft',
    ghost: 'hover:bg-muted text-foreground rounded-full',
  },

  card: {
    default: 'bg-card border border-card-border shadow-soft rounded-lg',
    elevated: 'bg-card border border-card-border shadow-medium rounded-lg',
    interactive: 'bg-card border border-card-border shadow-soft hover:shadow-medium hover:bg-card-hover transition-all rounded-lg',
  },

  badge: {
    primary: 'bg-primary/10 text-primary border-primary/20 rounded-full',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20 rounded-full',
    success: 'bg-success/10 text-success border-success/20 rounded-full',
    warning: 'bg-warning/10 text-warning border-warning/20 rounded-full',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20 rounded-full',
    muted: 'bg-muted text-muted-foreground border-border rounded-full',
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
