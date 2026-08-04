"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@components/common/Button";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

const Pagination = ({ page, pageSize, total, onPageChange }: Props) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = Math.min(total, (page - 1) * pageSize + 1);
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
        {total === 0 ? (
          "No results"
        ) : (
          <>
            Showing {from}–{to} of {total}
          </>
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          size="icon"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-mono text-xs text-muted px-2 tabular">
          {page} / {totalPages}
        </span>
        <Button
          size="icon"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
