"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppSelector } from "@hooks/useTypedRedux";
import { LOCAL_OFFLINE_USER } from "@/lib/local-session";
import { migrateLocalFinanceToApi } from "@/lib/migrate-local-to-api";

/** Copies legacy browser-only wallets/transactions/budgets into PostgreSQL once per account. */
export default function FinanceCloudMigration(): null {
  const qc = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const ran = useRef(false);

  useEffect(() => {
    if (!user || user.id === LOCAL_OFFLINE_USER.id) return;
    if (ran.current) return;
    ran.current = true;

    void migrateLocalFinanceToApi(user.email).then((did) => {
      if (did) {
        void qc.invalidateQueries();
        toast.success("Purana browser data ab database mein save ho chuka hai.");
      }
    });
  }, [user, qc]);

  return null;
}
