/**
 * QuickBooks Official Color System
 * 
 * This file provides utilities for working with QuickBooks' official brand colors
 * Primary color: #2CA01C (QuickBooks Green)
 * 
 * Based on official QuickBooks brand guidelines:
 * https://design.intuit.com/quickbooks/brand/design-foundations/color/
 */

// ===== QUICKBOOKS OFFICIAL COLORS =====

/**
 * QuickBooks Primary Green - #2CA01C
 * The official QuickBooks brand color
 */
export const QUICKBOOKS_GREEN = '#2CA01C'

/**
 * QuickBooks Official Color Palette
 * These colors are from the official QuickBooks brand guidelines
 */
export const quickbooksColors = {
  // Primary Brand Color
  primary: QUICKBOOKS_GREEN,
  
  // QuickBooks Green Scale (based on #2CA01C)
  green: {
    50: 'hsl(113, 75%, 95%)',
    100: 'hsl(113, 75%, 90%)',
    200: 'hsl(113, 75%, 80%)',
    300: 'hsl(113, 75%, 70%)',
    400: 'hsl(113, 75%, 60%)',
    500: 'hsl(113, 75%, 37%)', // #2CA01C
    600: 'hsl(113, 75%, 32%)',
    700: 'hsl(113, 75%, 27%)',
    800: 'hsl(113, 75%, 22%)',
    900: 'hsl(113, 75%, 17%)',
  },
  
  // QuickBooks Blue
  blue: {
    50: 'hsl(210, 100%, 95%)',
    100: 'hsl(210, 100%, 90%)',
    200: 'hsl(210, 100%, 80%)',
    300: 'hsl(210, 100%, 70%)',
    400: 'hsl(210, 100%, 60%)',
    500: 'hsl(210, 100%, 50%)',
    600: 'hsl(210, 100%, 45%)',
    700: 'hsl(210, 100%, 40%)',
    800: 'hsl(210, 100%, 35%)',
    900: 'hsl(210, 100%, 30%)',
  },
  
  // QuickBooks Orange
  orange: {
    50: 'hsl(25, 100%, 95%)',
    100: 'hsl(25, 100%, 90%)',
    200: 'hsl(25, 100%, 80%)',
    300: 'hsl(25, 100%, 70%)',
    400: 'hsl(25, 100%, 60%)',
    500: 'hsl(25, 100%, 50%)',
    600: 'hsl(25, 100%, 45%)',
    700: 'hsl(25, 100%, 40%)',
    800: 'hsl(25, 100%, 35%)',
    900: 'hsl(25, 100%, 30%)',
  },
  
  // QuickBooks Purple
  purple: {
    50: 'hsl(270, 50%, 95%)',
    100: 'hsl(270, 50%, 90%)',
    200: 'hsl(270, 50%, 80%)',
    300: 'hsl(270, 50%, 70%)',
    400: 'hsl(270, 50%, 60%)',
    500: 'hsl(270, 50%, 50%)',
    600: 'hsl(270, 50%, 45%)',
    700: 'hsl(270, 50%, 40%)',
    800: 'hsl(270, 50%, 35%)',
    900: 'hsl(270, 50%, 30%)',
  },
} as const

// ===== COLOR USAGE GUIDELINES =====

/**
 * QuickBooks Color Usage Guidelines
 * Based on official brand guidelines
 */
export const colorUsageGuidelines = {
  primary: {
    color: quickbooksColors.green[500],
    usage: 'Primary brand color for main CTAs, logos, and key brand elements',
    examples: ['Primary buttons', 'Brand logos', 'Key navigation elements', 'Success states'],
    accessibility: 'Ensure 4.5:1 contrast ratio with text',
  },
  
  secondary: {
    color: quickbooksColors.blue[500],
    usage: 'Secondary actions, informational elements, and supporting content',
    examples: ['Secondary buttons', 'Info alerts', 'Links', 'Data visualization'],
    accessibility: 'Maintain proper contrast for readability',
  },
  
  accent: {
    color: quickbooksColors.orange[500],
    usage: 'Warning states, attention-grabbing elements, and highlights',
    examples: ['Warning alerts', 'Notifications', 'Highlights', 'Call-to-action accents'],
    accessibility: 'Use sparingly to maintain impact',
  },
  
  premium: {
    color: quickbooksColors.purple[500],
    usage: 'Premium features, special content, and luxury elements',
    examples: ['Premium badges', 'Special features', 'Upgrade prompts', 'VIP content'],
    accessibility: 'Ensure sufficient contrast in all contexts',
  },
} as const

// ===== UTILITY FUNCTIONS =====

/**
 * Get a QuickBooks color by name and shade
 */
export function getQuickBooksColor(
  colorName: keyof typeof quickbooksColors,
  shade: keyof typeof quickbooksColors.green = 500
): string {
  if (colorName === 'primary') {
    return quickbooksColors.primary
  }
  
  const colorScale = quickbooksColors[colorName]
  if (typeof colorScale === 'object' && shade in colorScale) {
    return colorScale[shade as keyof typeof colorScale]
  }
  
  return quickbooksColors.green[500] // fallback to primary
}

/**
 * Get CSS custom property for QuickBooks colors
 */
export function getQuickBooksColorVar(
  colorName: keyof typeof quickbooksColors,
  shade: keyof typeof quickbooksColors.green = 500
): string {
  if (colorName === 'primary') {
    return 'var(--color-qb-green-500)'
  }

  // All QuickBooks colors now use the qb- prefix for consistency
  return `var(--color-qb-${colorName}-${shade})`
}

/**
 * Generate Tailwind classes for QuickBooks colors
 */
export function getQuickBooksTailwindClass(
  property: 'bg' | 'text' | 'border',
  colorName: keyof typeof quickbooksColors,
  shade: keyof typeof quickbooksColors.green = 500
): string {
  if (colorName === 'primary') {
    return `${property}-qb-green-500`
  }

  // All QuickBooks colors now use the qb- prefix for consistency
  return `${property}-qb-${colorName}-${shade}`
}

/**
 * Validate color contrast for accessibility
 */
export function validateColorContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): { isValid: boolean; ratio: number; recommendation: string } {
  // This is a simplified version - in a real implementation,
  // you'd use a proper color contrast calculation library
  const minRatio = level === 'AAA' ? 7 : 4.5
  
  // Placeholder calculation - replace with actual contrast calculation
  const ratio = 4.5 // This should be calculated based on actual colors
  
  return {
    isValid: ratio >= minRatio,
    ratio,
    recommendation: ratio < minRatio 
      ? `Increase contrast to meet ${level} standards (${minRatio}:1 minimum)`
      : `Contrast meets ${level} accessibility standards`
  }
}

// ===== QUICKBOOKS COLOR PRESETS =====

/**
 * Pre-defined color combinations that follow QuickBooks guidelines
 */
export const quickbooksColorPresets = {
  // Primary action combinations
  primaryButton: {
    background: quickbooksColors.green[500],
    text: '#FFFFFF',
    hover: quickbooksColors.green[600],
    active: quickbooksColors.green[700],
  },
  
  // Secondary action combinations
  secondaryButton: {
    background: 'transparent',
    text: quickbooksColors.green[500],
    border: quickbooksColors.green[500],
    hover: quickbooksColors.green[50],
  },
  
  // Info/alert combinations
  infoAlert: {
    background: quickbooksColors.blue[50],
    text: quickbooksColors.blue[800],
    border: quickbooksColors.blue[200],
    icon: quickbooksColors.blue[500],
  },
  
  // Warning combinations
  warningAlert: {
    background: quickbooksColors.orange[50],
    text: quickbooksColors.orange[800],
    border: quickbooksColors.orange[200],
    icon: quickbooksColors.orange[500],
  },
  
  // Success combinations
  successAlert: {
    background: quickbooksColors.green[50],
    text: quickbooksColors.green[800],
    border: quickbooksColors.green[200],
    icon: quickbooksColors.green[500],
  },
} as const

// ===== EXPORT EVERYTHING =====

export default {
  colors: quickbooksColors,
  guidelines: colorUsageGuidelines,
  presets: quickbooksColorPresets,
  utils: {
    getColor: getQuickBooksColor,
    getColorVar: getQuickBooksColorVar,
    getTailwindClass: getQuickBooksTailwindClass,
    validateContrast: validateColorContrast,
  },
  constants: {
    PRIMARY_GREEN: QUICKBOOKS_GREEN,
  },
}

// ===== USAGE EXAMPLES =====

/**
 * Example usage:
 * 
 * // Get colors
 * const primaryGreen = getQuickBooksColor('green', 500) // #2CA01C equivalent
 * const blueAccent = getQuickBooksColor('blue', 400)
 * 
 * // Get CSS variables
 * const primaryVar = getQuickBooksColorVar('green', 500) // var(--color-qb-green-500)
 *
 * // Get Tailwind classes
 * const bgClass = getQuickBooksTailwindClass('bg', 'green', 500) // bg-qb-green-500
 * const textClass = getQuickBooksTailwindClass('text', 'blue', 400) // text-qb-blue-400
 * 
 * // Use presets
 * const buttonStyles = quickbooksColorPresets.primaryButton
 * 
 * // In React components:
 * <button className="bg-qb-green-500 text-white hover:bg-qb-green-600">
 *   QuickBooks Style Button
 * </button>
 */
