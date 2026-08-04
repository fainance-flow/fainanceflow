import type { Metadata } from "next";
import ForgotPasswordView from "@components/blocks/auth/forgotPasswordView";

export const metadata: Metadata = {
  title: "Reset Password · FinanceFlow",
};

const ForgotPasswordPage = () => <ForgotPasswordView />;

export default ForgotPasswordPage;
