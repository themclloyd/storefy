/**
 * Semantic Button Component
 * 
 * Demonstrates the new QuickBooks/Intuit-inspired semantic token system
 * Following Element-Prominence-Purpose-State taxonomy
 * 
 * This component shows how to use semantic tokens instead of hardcoded colors
 * to create more maintainable and consistent UI components.
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Using semantic token approach for button variants
const semanticButtonVariants = cva(
  // Base styles using semantic tokens
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Prominence variants following Intuit's taxonomy
      prominence: {
        // Primary: Most important actions (save, submit, confirm)
        primary: [
          "bg-action-primary text-text-inverse",
          "hover:bg-action-primary-hover",
          "active:bg-action-primary-active",
          "disabled:bg-action-primary-disabled",
        ],
        // Secondary: Supporting actions (cancel, back, edit)
        secondary: [
          "bg-action-secondary text-text-primary border border-border",
          "hover:bg-action-secondary-hover hover:border-border",
          "active:bg-action-secondary-active",
        ],
        // Tertiary: Subtle actions (learn more, view details)
        tertiary: [
          "bg-transparent text-text-accent",
          "hover:bg-surface-accent-hover",
          "active:bg-surface-accent",
        ],
        // Accent: Brand highlight actions (get started, upgrade)
        accent: [
          "bg-surface-accent text-text-accent border border-border",
          "hover:bg-surface-accent-hover hover:border-border",
        ],
      },
      // Purpose variants for semantic meaning
      purpose: {
        default: "",
        // Positive: Success, confirmation, growth actions
        positive: [
          "bg-status-positive text-text-inverse",
          "hover:brightness-110",
          "active:brightness-90",
        ],
        // Negative: Destructive, danger actions
        negative: [
          "bg-status-negative text-text-inverse",
          "hover:brightness-110",
          "active:brightness-90",
        ],
        // Warning: Caution, attention-needed actions
        warning: [
          "bg-status-warning text-text-inverse",
          "hover:brightness-110",
          "active:brightness-90",
        ],
        // Info: Informational, neutral actions
        info: [
          "bg-status-info text-text-inverse",
          "hover:brightness-110",
          "active:brightness-90",
        ],
      },
      // Size variants using semantic spacing
      size: {
        sm: "h-8 px-sm text-xs",
        default: "h-10 px-md",
        lg: "h-12 px-lg text-base",
        xl: "h-14 px-xl text-lg",
      },
    },
    // Compound variants for specific combinations
    compoundVariants: [
      {
        prominence: "primary",
        purpose: "positive",
        className: "bg-status-positive hover:bg-status-positive/90",
      },
      {
        prominence: "primary",
        purpose: "negative",
        className: "bg-status-negative hover:bg-status-negative/90",
      },
      {
        prominence: "secondary",
        purpose: "positive",
        className: "text-status-positive border-status-positive hover:bg-status-positive-surface",
      },
      {
        prominence: "secondary",
        purpose: "negative",
        className: "text-status-negative border-status-negative hover:bg-status-negative-surface",
      },
    ],
    defaultVariants: {
      prominence: "primary",
      purpose: "default",
      size: "default",
    },
  }
)

export interface SemanticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof semanticButtonVariants> {
  asChild?: boolean
}

/**
 * Semantic Button Component
 * 
 * @param prominence - Visual hierarchy level (primary, secondary, tertiary, accent)
 * @param purpose - Semantic meaning (default, positive, negative, warning, info)
 * @param size - Button size using semantic spacing
 * 
 * Examples:
 * - Save button: prominence="primary" purpose="positive"
 * - Delete button: prominence="primary" purpose="negative"
 * - Cancel button: prominence="secondary"
 * - Learn more: prominence="tertiary"
 */
const SemanticButton = React.forwardRef<HTMLButtonElement, SemanticButtonProps>(
  ({ className, prominence, purpose, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(semanticButtonVariants({ prominence, purpose, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
SemanticButton.displayName = "SemanticButton"

export { SemanticButton, semanticButtonVariants }

// ===== USAGE EXAMPLES =====

/**
 * Example usage following QuickBooks patterns:
 * 
 * // Primary action (most important)
 * <SemanticButton prominence="primary" purpose="positive">
 *   Save Changes
 * </SemanticButton>
 * 
 * // Destructive action
 * <SemanticButton prominence="primary" purpose="negative">
 *   Delete Item
 * </SemanticButton>
 * 
 * // Secondary action
 * <SemanticButton prominence="secondary">
 *   Cancel
 * </SemanticButton>
 * 
 * // Subtle action
 * <SemanticButton prominence="tertiary">
 *   Learn More
 * </SemanticButton>
 * 
 * // Brand highlight
 * <SemanticButton prominence="accent">
 *   Get Started
 * </SemanticButton>
 * 
 * // Warning action
 * <SemanticButton prominence="primary" purpose="warning">
 *   Archive Store
 * </SemanticButton>
 * 
 * // Info action
 * <SemanticButton prominence="secondary" purpose="info">
 *   View Details
 * </SemanticButton>
 */

// ===== DESIGN RATIONALE =====

/**
 * Why this approach follows QuickBooks/Intuit principles:
 * 
 * 1. SEMANTIC NAMING: Instead of "variant" we use "prominence" and "purpose"
 *    which clearly communicate the intent and hierarchy
 * 
 * 2. CLEAR TAXONOMY: Element (button) + Prominence (primary/secondary) + 
 *    Purpose (positive/negative) + State (hover/active) = predictable naming
 * 
 * 3. HIGH USE CASE COVERAGE: These variants can handle most button scenarios
 *    without needing component-specific tokens
 * 
 * 4. MAINTAINABLE: Changing brand colors only requires updating CSS variables,
 *    not individual component styles
 * 
 * 5. ACCESSIBLE: Semantic meaning helps screen readers and automated testing
 * 
 * 6. CONSISTENT: Following the same pattern across all components creates
 *    a cohesive design language
 */
