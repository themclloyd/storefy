import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react'; // If you have lucide-react or similar icons, otherwise use text

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-dark shadow-soft",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-dark shadow-soft border border-border",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-soft",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-soft",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft",
        outline: "border border-border bg-background hover:bg-muted text-foreground shadow-soft",
        ghost: "hover:bg-muted text-muted-foreground hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4",
        lg: "h-12 px-8",
        xl: "h-14 px-10 text-base",
        icon: "h-11 w-11",
      },
      rounded: {
        default: "rounded-full",
        sm: "rounded-lg",
        lg: "rounded-full",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

// ThemeToggleButton: toggles between light and dark mode
export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-3 rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors shadow-sm"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
