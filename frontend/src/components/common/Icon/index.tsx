import * as Icons from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@utils/cn";

type IconName = keyof typeof Icons;

type Props = LucideProps & {
  name: IconName | string;
};

const ICON_MAP: Record<string, IconName> = {
  wallet: "Wallet",
  landmark: "Landmark",
  "building-2": "Building2",
  car: "Car",
  shield: "Shield",
  target: "Target",
  home: "Home",
};

export const resolveIcon = (name: string): IconName => ICON_MAP[name] ?? "Circle";

const Icon = ({ name, className, ...rest }: Props) => {
  const Cmp =
    (Icons as unknown as Record<string, LucideIcon | undefined>)[name as string] ?? Icons.Circle;
  return <Cmp className={cn("shrink-0", className)} strokeWidth={1.6} {...rest} />;
};

export default Icon;
