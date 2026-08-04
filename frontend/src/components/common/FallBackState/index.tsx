import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@utils/cn";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "empty" | "error";
};

const FallBackState = ({
  icon: IconComp = Sparkles,
  title,
  description,
  action,
  className,
  variant = "empty",
}: Props) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        "border border-dashed border-line-strong rounded-xl bg-surface/40",
        className
      )}
    >
      <div
        className={cn(
          "h-14 w-14 rounded-2xl grid place-items-center mb-4",
          variant === "error"
            ? "bg-terra/10 text-terra border border-terra/20"
            : "bg-surface-2 text-gold border border-line-strong"
        )}
      >
        <IconComp className="h-6 w-6" strokeWidth={1.4} />
      </div>
      <p className="font-display text-xl tracking-tight">{title}</p>
      {description && <p className="text-sm text-muted mt-1 max-w-prose">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default FallBackState;
