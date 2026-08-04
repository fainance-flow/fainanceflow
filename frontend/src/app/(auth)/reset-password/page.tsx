import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordView from "@components/blocks/auth/resetPasswordView";

export const metadata: Metadata = {
  title: "Set New Password · FinanceFlow",
};

const ResetPasswordPage = () => (
  <Suspense>
    <ResetPasswordView />
  </Suspense>
);

export default ResetPasswordPage;
