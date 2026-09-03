import * as React from "react";
import { cn } from "@utils/cn";

export type TableColumn<T> = {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right" | "center";
  cell: (row: T) => React.ReactNode;
  className?: string;
};

type Props<T> = {
  data: T[];
  columns: TableColumn<T>[];
  emptyState?: React.ReactNode;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
};

const Table = <T,>({ data, columns, emptyState, rowKey, onRowClick }: Props<T>) => {
  if (data.length === 0 && emptyState) return <>{emptyState}</>;
  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-surface">
      <table className="w-full">
        <thead>
          <tr className="border-b border-line-strong">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-4 py-3 font-mono text-[10px] tracking-[0.16em] uppercase text-muted",
                  c.align === "right"
                    ? "text-right"
                    : c.align === "center"
                      ? "text-center"
                      : "text-left",
                  c.className
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-line/60 last:border-b-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-surface-2/50"
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-4 py-3 text-sm",
                    c.align === "right"
                      ? "text-right tabular"
                      : c.align === "center"
                        ? "text-center"
                        : "text-left",
                    c.className
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
