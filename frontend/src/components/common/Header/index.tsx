import { cn } from "@utils/cn";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
};

const Header = ({ eyebrow, title, subtitle, className }: Props) => {
  return (
    <div className={cn("flex flex-col gap-2 mb-4", className)}>
      {eyebrow && <span className="editorial-rule">{eyebrow}</span>}
      <h2 className="font-display text-2xl tracking-tight font-normal">{title}</h2>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </div>
  );
};

export default Header;
