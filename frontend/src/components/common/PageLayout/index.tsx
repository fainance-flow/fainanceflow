import { cn } from "@utils/cn";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /**
   * When true, removes the bottom border below the page header.
   * Use this for dashboard-style routes that own their own hero block.
   */
  bare?: boolean;
};

const PageLayout = ({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className,
  bare = false,
}: Props) => {
  return (
    <div className={cn("ff-page", className)}>
      <header
        className={cn("ff-page__header", bare && "!border-b-0 !pb-0")}
      >
        <div className="ff-page__title-block">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="ff-page__actions">{actions}</div>}
      </header>

      <div className="ff-page__body flex flex-col gap-6">{children}</div>
    </div>
  );
};

export default PageLayout;
