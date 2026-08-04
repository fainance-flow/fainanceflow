import * as React from "react";
import { cn } from "@utils/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  direction?: "row" | "col";
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8;
  wrap?: boolean;
  as?: keyof JSX.IntrinsicElements;
};

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
} as const;

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
} as const;

const gapMap = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
} as const;

const Flex = ({
  direction = "row",
  align,
  justify,
  gap,
  wrap,
  as: As = "div",
  className,
  ...rest
}: Props) => {
  const Component = As as React.ElementType;
  return (
    <Component
      className={cn(
        "flex",
        direction === "col" ? "flex-col" : "flex-row",
        align && alignMap[align],
        justify && justifyMap[justify],
        gap && gapMap[gap],
        wrap && "flex-wrap",
        className
      )}
      {...rest}
    />
  );
};

export default Flex;
