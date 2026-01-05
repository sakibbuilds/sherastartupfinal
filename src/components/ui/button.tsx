import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-btn hover:shadow-btn-hover",
        outline: "border-2 border-border bg-white hover:bg-secondary hover:border-primary/20 text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        navy: "bg-primary text-primary-foreground shadow-navy hover:shadow-navy-lg hover:-translate-y-0.5",
        soft: "bg-white text-foreground border border-border/50 shadow-soft hover:shadow-soft-md hover:-translate-y-0.5",
        hero: "bg-primary text-primary-foreground px-8 py-6 text-base font-semibold shadow-navy hover:shadow-navy-lg hover:-translate-y-1",
        "hero-outline": "border-2 border-primary/30 bg-white/80 backdrop-blur-sm text-primary px-8 py-6 text-base font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary",
        glass: "bg-white/70 backdrop-blur-xl border border-white/50 text-foreground shadow-soft hover:bg-white hover:shadow-soft-md",
        icon: "bg-white border border-border/30 text-foreground shadow-soft hover:shadow-soft-md hover:bg-secondary",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8",
        xl: "h-14 px-10 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
