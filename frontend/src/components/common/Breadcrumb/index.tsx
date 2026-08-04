import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@utils/cn";

type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  items: Crumb[];
  className?: string;
};

const Breadcrumb = ({ items, className }: Props) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted",
        className
      )}
    >
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
            {c.href && !isLast ? (
              <Link href={c.href} className="hover:text-ink transition-colors">
                {c.label}
              </Link>
            ) : (
              <span className={isLast ? "text-ink" : ""}>{c.label}</span>
            )}
            {!isLast && <ChevronRight className="h-3 w-3 opacity-50" />}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
