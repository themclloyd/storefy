/**
 * Semantic Button Component - Migration Example
 * 
 * This shows how to migrate the existing button component to use
 * the new QuickBooks/Intuit-inspired semantic token system
 * 
 * BEFORE: Hardcoded variant names with unclear semantic meaning
 * AFTER: Clear semantic taxonomy following Element-Prominence-Purpose-State
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ===== MIGRATION COMPARISON =====

/**
 * OLD APPROACH (what we're replacing):
 * - Variant names: "default", "destructive", "outline", "secondary", "ghost", "link"
 * - Problems: Unclear hierarchy, mixed semantic meanings, hard to extend
 * - Example: What's the difference between "default" and "secondary"?
 */

/**
 * NEW APPROACH (semantic tokens):
 * - Clear taxonomy: prominence + purpose + state
 * - Benefits: Predictable naming, easy to extend, clear hierarchy
 * - Example: "primary" vs "secondary" clearly shows importance level
 */

// ===== NEW SEMANTIC BUTTON VARIANTS =====

const semanticButtonVariants = cva(
  // Base styles using semantic tokens instead of hardcoded colors
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // PROMINENCE: Visual hierarchy (replaces confusing variant names)
      prominence: {
        // Primary: Most important actions (was "default")
        primary: [
          "bg-action-primary text-text-inverse",
          "hover:bg-action-primary-hover",
          "active:bg-action-primary-active",
          "disabled:bg-action-primary-disabled",
        ],
        // Secondary: Supporting actions (was "secondary" + "outline")
        secondary: [
          "bg-action-secondary text-text-primary border border-border-primary",
          "hover:bg-action-secondary-hover hover:border-border-primary-hover",
          "active:bg-action-secondary-active",
        ],
        // Tertiary: Subtle actions (was "ghost")
        tertiary: [
          "bg-transparent text-text-accent",
          "hover:bg-surface-accent-hover",
          "active:bg-surface-accent",
        ],
        // Link: Text-only actions (was "link")
        link: [
          "bg-transparent text-text-accent underline-offset-4",
          "hover:underline",
          "active:text-text-accent/80",
        ],
      },
      
      // PURPOSE: Semantic meaning (clearer than "destructive")
      purpose: {
        default: "",
        // Positive: Success, confirmation, creation
        positive: [
          "bg-status-positive text-text-inverse",
          "hover:bg-status-positive/90",
          "active:bg-status-positive/80",
        ],
        // Negative: Destructive, dangerous actions (was "destructive")
        negative: [
          "bg-status-negative text-text-inverse",
          "hover:bg-status-negative/90",
          "active:bg-status-negative/80",
        ],
        // Warning: Caution, attention needed
        warning: [
          "bg-status-warning text-text-inverse",
          "hover:bg-status-warning/90",
          "active:bg-status-warning/80",
        ],
        // Info: Informational actions
        info: [
          "bg-status-info text-text-inverse",
          "hover:bg-status-info/90",
          "active:bg-status-info/80",
        ],
      },
      
      // SIZE: Using semantic spacing tokens
      size: {
        sm: "h-8 px-sm text-xs",
        default: "h-10 px-md",
        lg: "h-12 px-lg text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    
    // Compound variants for specific combinations
    compoundVariants: [
      // Secondary buttons with semantic purposes
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
      {
        prominence: "secondary",
        purpose: "warning",
        className: "text-status-warning border-status-warning hover:bg-status-warning-surface",
      },
      {
        prominence: "secondary",
        purpose: "info",
        className: "text-status-info border-status-info hover:bg-status-info-surface",
      },
      
      // Tertiary buttons with semantic purposes
      {
        prominence: "tertiary",
        purpose: "positive",
        className: "text-status-positive hover:bg-status-positive-surface",
      },
      {
        prominence: "tertiary",
        purpose: "negative",
        className: "text-status-negative hover:bg-status-negative-surface",
      },
    ],
    
    defaultVariants: {
      prominence: "primary",
      purpose: "default",
      size: "default",
    },
  }
)

// ===== COMPONENT INTERFACE =====

export interface SemanticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof semanticButtonVariants> {
  asChild?: boolean
}

// ===== COMPONENT IMPLEMENTATION =====

const SemanticButtonMigration = React.forwardRef<HTMLButtonElement, SemanticButtonProps>(
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
SemanticButtonMigration.displayName = "SemanticButtonMigration"

export { SemanticButtonMigration, semanticButtonVariants }

// ===== MIGRATION GUIDE =====

/**
 * HOW TO MIGRATE FROM OLD TO NEW:
 * 
 * OLD: <Button variant="default">Save</Button>
 * NEW: <SemanticButton prominence="primary">Save</SemanticButton>
 * 
 * OLD: <Button variant="destructive">Delete</Button>
 * NEW: <SemanticButton prominence="primary" purpose="negative">Delete</SemanticButton>
 * 
 * OLD: <Button variant="outline">Cancel</Button>
 * NEW: <SemanticButton prominence="secondary">Cancel</SemanticButton>
 * 
 * OLD: <Button variant="secondary">Edit</Button>
 * NEW: <SemanticButton prominence="secondary">Edit</SemanticButton>
 * 
 * OLD: <Button variant="ghost">Learn More</Button>
 * NEW: <SemanticButton prominence="tertiary">Learn More</SemanticButton>
 * 
 * OLD: <Button variant="link">View Details</Button>
 * NEW: <SemanticButton prominence="link">View Details</SemanticButton>
 */

// ===== BENEFITS OF MIGRATION =====

/**
 * 1. CLEARER HIERARCHY:
 *    - "primary" vs "secondary" vs "tertiary" shows clear importance levels
 *    - No confusion about when to use "default" vs "secondary"
 * 
 * 2. SEMANTIC MEANING:
 *    - "purpose" clearly communicates intent (positive, negative, warning, info)
 *    - Better than cryptic "destructive" variant
 * 
 * 3. CONSISTENT TAXONOMY:
 *    - All components follow Element-Prominence-Purpose-State pattern
 *    - Predictable naming across the entire design system
 * 
 * 4. EASIER THEMING:
 *    - Colors come from semantic tokens, not hardcoded values
 *    - Changing brand colors updates all components automatically
 * 
 * 5. BETTER ACCESSIBILITY:
 *    - Semantic meaning helps screen readers understand button purpose
 *    - Clear hierarchy improves navigation for assistive technologies
 * 
 * 6. SCALABLE DESIGN:
 *    - Easy to add new purposes or prominence levels
 *    - No need for component-specific color variants
 */
