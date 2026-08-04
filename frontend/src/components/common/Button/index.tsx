"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@utils/cn";

// Binance-aligned button system.
// - primary: yellow #FCD535 + black text, identical in light + dark modes.
// - pill:    same colors at full-pill radius for top-of-page CTAs.
// - secondary: surface bg with hairline border, theme-aware.
// - outline / ghost: low-emphasis actions, theme-aware.
// - trading-up / trading-down: green/red semantic buttons for Buy/Sell intents only.
// - danger / success: destructive / positive utility actions (subdued tonal fills).
// - link: inline yellow text link, no underline by default.
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-sans font-semibold tracking-[0.005em]",
    "transition-colors duration-150 cursor-pointer select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/55 focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        // Binance signature — yellow background, black text, both modes
        primary:
          "bg-primary text-on-primary hover:bg-primary-active",
        // Yellow + black at pill radius — top-of-page CTA
        pill:
          "bg-primary text-on-primary hover:bg-primary-active",
        // Surface card with hairline — light + dark aware
        secondary:
          "bg-surface text-ink border border-line-strong hover:border-muted hover:bg-surface-2",
        // Transparent with hairline
        outline:
          "bg-transparent text-ink border border-line-strong hover:border-muted hover:bg-surface-2",
        // No background, no border
        ghost:
          "bg-transparent text-muted hover:text-ink hover:bg-surface-2",
        // Inline text link — yellow on both modes, no underline by default
        link:
          "bg-transparent text-primary hover:underline underline-offset-4 px-0 py-0 h-auto",
        // Semantic trading buttons — used only for Buy/Sell / Long/Short
        "trading-up":
          "bg-emerald text-white hover:brightness-110",
        "trading-down":
          "bg-terra text-white hover:brightness-110",
        // Destructive — subdued red tonal fill
        danger:
          "bg-terra/10 text-terra border border-terra/30 hover:bg-terra/15 hover:border-terra/45",
        // Positive — subdued green tonal fill
        success:
          "bg-emerald/10 text-emerald border border-emerald/30 hover:bg-emerald/15 hover:border-emerald/45",
        // Legacy gold alias — same as primary
        gold:
          "bg-primary text-on-primary hover:bg-primary-active",
      },
      size: {
        xs:   "h-7  px-2.5 text-xs   rounded-sm",
        sm:   "h-8  px-3   text-xs   rounded-md",
        md:   "h-10 px-4   text-sm   rounded-md",
        lg:   "h-12 px-6   text-[15px] rounded-lg",
        xl:   "h-14 px-8   text-base rounded-lg",
        icon: "h-9  w-9    rounded-md",
        "icon-sm": "h-7 w-7 rounded-sm",
      },
    },
    compoundVariants: [
      // Pill variant always overrides size radius to full pill
      { variant: "pill", className: "rounded-pill px-7" },
      // Trading buttons default to tighter shape per Binance spec
      { variant: "trading-up",   size: "md", className: "rounded-sm" },
      { variant: "trading-down", size: "md", className: "rounded-sm" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && (
              <span
                aria-hidden
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin"
              />
            )}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export default Button;
