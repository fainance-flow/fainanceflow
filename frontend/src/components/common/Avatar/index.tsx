import { cn } from "@utils/cn";

type Props = {
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
} as const;

const Avatar = ({ name = "?", size = "md", className }: Props) => {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-full font-display tracking-tight",
        "bg-gradient-to-br from-gold to-emerald text-canvas",
        "shadow-[0_1px_0_rgb(255_255_255/0.2)_inset,0_4px_12px_rgb(var(--c-gold)/0.25)]",
        sizeMap[size],
        className
      )}
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
};

export default Avatar;
