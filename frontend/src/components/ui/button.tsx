import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading
    const baseClass = cn(
      buttonVariants({ variant, size }),
      "transition-transform duration-150 will-change-transform",
      "active:translate-y-0.5 active:scale-[0.995]", // subtle press effect
      "focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
      isLoading && "opacity-90 pointer-events-none",
      className
    )

    // If used with `asChild`, clone the single element child and merge props.
    // Also prepend the spinner into the child's children (so the Slot still has only one child).
    if (asChild) {
      let child: React.ReactElement | null = null
      try {
        child = React.Children.only(children) as React.ReactElement
      } catch (err) {
        console.warn("Button (asChild) expects a single React element child. Falling back to Slot rendering.")
        // Fallback: render a Slot to avoid further runtime errors (keep UI working)
        const Comp = Slot
        return (
          <Comp
            className={baseClass}
            ref={ref as any}
            {...props}
            disabled={isDisabled}
            aria-busy={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            {children}
          </Comp>
        )
      }

      const spinner = isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null
      // Merge className & props into child; ensure disabled/aria-busy are set
      const mergedClassName = cn(child.props?.className, baseClass)
      const mergedProps = {
        ref,
        className: mergedClassName,
        disabled: isDisabled || child.props?.disabled,
        "aria-busy": isLoading || child.props?.["aria-busy"],
        ...props,
      }

      // Preserve child's original children and prepend spinner if required
      const childChildren = child.props?.children
      const newChildren = spinner ? (<>{spinner}{childChildren}</>) : childChildren

      return React.cloneElement(child, mergedProps, newChildren)
    }

    // Normal rendering when not using asChild
    return (
      <button
        className={baseClass}
        ref={ref}
        {...props}
        disabled={isDisabled}
        aria-busy={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow transition-shadow hover:shadow-lg",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 border-b border-border", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Button, buttonVariants, Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
