import { cn } from "@utils/cn";

type Props = {
  className?: string;
  rows?: number;
};

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("skeleton", className)} />
);

const LoadingOverlay = ({ className, rows = 4 }: Props) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton h-9 w-9 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-2/3 rounded" />
            <div className="skeleton h-2 w-1/3 rounded" />
          </div>
          <div className="skeleton h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
};

export default LoadingOverlay;
