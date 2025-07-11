/**
 * Storefy Design System - Semantic Design Tokens
 * 
 * Inspired by QuickBooks/Intuit Design System principles
 * Following Element-Prominence-Purpose-State taxonomy
 * 
 * This file provides TypeScript definitions and utilities for our semantic token system.
 * It helps avoid common design system errors by providing clear, semantic naming
 * and proper abstraction layers.
 */

// ===== TOKEN TAXONOMY TYPES =====

/**
 * Element: What UI object uses this token
 */
export type TokenElement = 
  | 'surface'    // Backgrounds, containers
  | 'text'       // Typography, labels
  | 'action'     // Buttons, links, interactive elements
  | 'border'     // Outlines, separators
  | 'status'     // Feedback, states
  | 'data'       // Charts, visualizations
  | 'input'      // Form fields, controls

/**
 * Prominence: Visual hierarchy level
 */
export type TokenProminence = 
  | 'primary'    // Most important, highest contrast
  | 'secondary'  // Supporting, medium contrast
  | 'tertiary'   // Subtle, low contrast
  | 'accent'     // Brand highlight
  | 'inverse'    // Opposite theme (light on dark, dark on light)

/**
 * Purpose: What's being communicated to the user
 */
export type TokenPurpose = 
  | 'default'    // Neutral, no specific meaning
  | 'positive'   // Success, confirmation, growth
  | 'negative'   // Error, danger, decline
  | 'warning'    // Caution, attention needed
  | 'info'       // Information, neutral feedback
  | 'muted'      // De-emphasized, less important

/**
 * State: Interactive or temporal state
 */
export type TokenState = 
  | 'default'    // Normal, resting state
  | 'hover'      // Mouse over
  | 'active'     // Pressed, selected
  | 'focus'      // Keyboard focus
  | 'disabled'   // Inactive, unavailable
  | 'loading'    // Processing, pending

// ===== SEMANTIC TOKEN DEFINITIONS =====

/**
 * Surface tokens - for backgrounds and containers
 * Usage: Backgrounds, cards, panels, overlays
 */
export const surfaceTokens = {
  primary: {
    default: 'hsl(var(--surface-primary-default))',
    hover: 'hsl(var(--surface-primary-hover))',
  },
  secondary: {
    default: 'hsl(var(--surface-secondary-default))',
    hover: 'hsl(var(--surface-secondary-hover))',
  },
  accent: {
    default: 'hsl(var(--surface-accent-default))',
    hover: 'hsl(var(--surface-accent-hover))',
  },
  inverse: {
    default: 'hsl(var(--surface-inverse-default))',
  },
} as const

/**
 * Text tokens - for typography and labels
 * Usage: Headings, body text, labels, captions
 */
export const textTokens = {
  primary: {
    default: 'hsl(var(--text-primary-default))',
    muted: 'hsl(var(--text-primary-muted))',
  },
  secondary: {
    default: 'hsl(var(--text-secondary-default))',
  },
  accent: {
    default: 'hsl(var(--text-accent-default))',
  },
  inverse: {
    default: 'hsl(var(--text-inverse-default))',
  },
} as const

/**
 * Action tokens - for interactive elements
 * Usage: Buttons, links, clickable areas
 */
export const actionTokens = {
  primary: {
    default: 'hsl(var(--action-primary-default))',
    hover: 'hsl(var(--action-primary-hover))',
    active: 'hsl(var(--action-primary-active))',
    disabled: 'hsl(var(--action-primary-disabled))',
  },
  secondary: {
    default: 'hsl(var(--action-secondary-default))',
    hover: 'hsl(var(--action-secondary-hover))',
    active: 'hsl(var(--action-secondary-active))',
  },
} as const

/**
 * Border tokens - for outlines and separators
 * Usage: Input borders, dividers, card outlines
 */
export const borderTokens = {
  primary: {
    default: 'hsl(var(--border-primary-default))',
    hover: 'hsl(var(--border-primary-hover))',
  },
  accent: {
    default: 'hsl(var(--border-accent-default))',
    hover: 'hsl(var(--border-accent-hover))',
  },
} as const

/**
 * Status tokens - for feedback and states
 * Usage: Alerts, notifications, status indicators
 */
export const statusTokens = {
  positive: {
    default: 'hsl(var(--status-positive-default))',
    surface: 'hsl(var(--status-positive-surface))',
  },
  negative: {
    default: 'hsl(var(--status-negative-default))',
    surface: 'hsl(var(--status-negative-surface))',
  },
  warning: {
    default: 'hsl(var(--status-warning-default))',
    surface: 'hsl(var(--status-warning-surface))',
  },
  info: {
    default: 'hsl(var(--status-info-default))',
    surface: 'hsl(var(--status-info-surface))',
  },
} as const

// ===== UTILITY FUNCTIONS =====

/**
 * Get a semantic token value
 * @param element - The UI element type
 * @param prominence - The visual prominence level
 * @param purpose - The communication purpose (optional)
 * @param state - The interaction state (optional)
 */
export function getSemanticToken(
  element: TokenElement,
  prominence: TokenProminence,
  purpose: TokenPurpose = 'default',
  state: TokenState = 'default'
): string {
  // Construct CSS variable name following our taxonomy
  const tokenName = [element, prominence, purpose, state]
    .filter(part => part !== 'default' || element === 'surface') // Keep 'default' for surface tokens
    .join('-')
  
  return `hsl(var(--${tokenName}))`
}

/**
 * Spacing tokens following consistent scale
 */
export const spacingTokens = {
  xs: 'var(--spacing-xs)',    // 4px
  sm: 'var(--spacing-sm)',    // 8px
  md: 'var(--spacing-md)',    // 16px
  lg: 'var(--spacing-lg)',    // 24px
  xl: 'var(--spacing-xl)',    // 32px
  '2xl': 'var(--spacing-2xl)', // 48px
} as const

/**
 * Typography scale following QuickBooks principles
 */
export const typographyTokens = {
  fontFamily: {
    primary: ['Space Grotesk', 'system-ui', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
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
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

/**
 * Shadow tokens for depth and elevation
 */
export const shadowTokens = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const

// ===== ADVANCED TOKEN UTILITIES =====

/**
 * Token builder for creating semantic class names
 * Follows Intuit's taxonomy: element-prominence-purpose-state
 */
export class TokenBuilder {
  private element: TokenElement
  private prominence?: TokenProminence
  private purpose?: TokenPurpose
  private state?: TokenState

  constructor(element: TokenElement) {
    this.element = element
  }

  prominence(prominence: TokenProminence): TokenBuilder {
    this.prominence = prominence
    return this
  }

  purpose(purpose: TokenPurpose): TokenBuilder {
    this.purpose = purpose
    return this
  }

  state(state: TokenState): TokenBuilder {
    this.state = state
    return this
  }

  /**
   * Build the CSS class name
   */
  build(): string {
    const parts = [this.element]

    if (this.prominence) parts.push(this.prominence)
    if (this.purpose && this.purpose !== 'default') parts.push(this.purpose)
    if (this.state && this.state !== 'default') parts.push(this.state)

    return parts.join('-')
  }

  /**
   * Build the CSS variable name
   */
  buildVar(): string {
    return `var(--${this.build()})`
  }

  /**
   * Build the HSL color value
   */
  buildHsl(): string {
    return `hsl(${this.buildVar()})`
  }
}

/**
 * Create a token builder for an element
 */
export function token(element: TokenElement): TokenBuilder {
  return new TokenBuilder(element)
}

/**
 * Quick token access functions for common patterns
 */
export const tokens = {
  // Surface tokens
  surface: {
    primary: () => token('surface').prominence('primary').buildHsl(),
    secondary: () => token('surface').prominence('secondary').buildHsl(),
    accent: () => token('surface').prominence('accent').buildHsl(),
    inverse: () => token('surface').prominence('inverse').buildHsl(),
  },

  // Text tokens
  text: {
    primary: () => token('text').prominence('primary').buildHsl(),
    secondary: () => token('text').prominence('secondary').buildHsl(),
    accent: () => token('text').prominence('accent').buildHsl(),
    inverse: () => token('text').prominence('inverse').buildHsl(),
    muted: () => token('text').prominence('primary').purpose('muted').buildHsl(),
  },

  // Action tokens
  action: {
    primary: () => token('action').prominence('primary').buildHsl(),
    secondary: () => token('action').prominence('secondary').buildHsl(),
    primaryHover: () => token('action').prominence('primary').state('hover').buildHsl(),
    secondaryHover: () => token('action').prominence('secondary').state('hover').buildHsl(),
  },

  // Status tokens
  status: {
    positive: () => token('status').purpose('positive').buildHsl(),
    negative: () => token('status').purpose('negative').buildHsl(),
    warning: () => token('status').purpose('warning').buildHsl(),
    info: () => token('status').purpose('info').buildHsl(),
  },
} as const

/**
 * Validate token combinations
 */
export function validateTokenCombination(
  element: TokenElement,
  prominence?: TokenProminence,
  purpose?: TokenPurpose,
  state?: TokenState
): { isValid: boolean; suggestions: string[] } {
  const suggestions: string[] = []

  // Status elements should have purpose
  if (element === 'status' && !purpose) {
    suggestions.push('Status tokens should specify a purpose (positive, negative, warning, info)')
  }

  // Action elements should have prominence
  if (element === 'action' && !prominence) {
    suggestions.push('Action tokens should specify prominence (primary, secondary, tertiary)')
  }

  // Interactive states only make sense for certain elements
  if (state && ['hover', 'active', 'focus'].includes(state) && !['action', 'surface'].includes(element)) {
    suggestions.push(`Interactive state "${state}" is not typically used with "${element}" elements`)
  }

  return {
    isValid: suggestions.length === 0,
    suggestions,
  }
}

// ===== EXPORT ALL TOKENS =====
export const designTokens = {
  surface: surfaceTokens,
  text: textTokens,
  action: actionTokens,
  border: borderTokens,
  status: statusTokens,
  spacing: spacingTokens,
  typography: typographyTokens,
  shadow: shadowTokens,
  // Utility functions
  token,
  tokens,
  validateTokenCombination,
} as const

export type DesignTokens = typeof designTokens
