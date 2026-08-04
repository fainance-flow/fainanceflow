import * as React from "react";
import { cn } from "@utils/cn";

type Tone =
  | "neutral"
  | "primary"
  | "gold"
  | "emerald"
  | "terra"
  | "muted"
  | "trading-up"
  | "trading-down";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  dot?: boolean;
};

const toneStyles: Record<Tone, string> = {
  // Binance: subtle surface chips with semantic text color.
  neutral:        "bg-surface-2 text-ink border-line-strong",
  primary:        "bg-primary/15 text-primary border-primary/40",
  gold:           "bg-primary/15 text-primary border-primary/40", // alias
  emerald:        "bg-emerald/12 text-emerald border-emerald/30",
  terra:          "bg-terra/12 text-terra border-terra/30",
  muted:          "bg-transparent text-muted border-line-strong",
  "trading-up":   "bg-transparent text-emerald border-emerald/30",
  "trading-down": "bg-transparent text-terra border-terra/30",
};

const Badge = ({ tone = "neutral", dot, className, children, ...rest }: Props) => {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border",
        "font-mono text-[10px] tracking-[0.10em] uppercase",
        toneStyles[tone],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
};

export default Badge;
