"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KeyRound, Lock, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import Input from "@components/common/Input";
import Button from "@components/common/Button";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@schemas/auth";
import { resetPassword } from "@services/auth";

const ResetPasswordView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: tokenFromUrl, newPassword: "", confirmPassword: "" },
  });

  const newPw = watch("newPassword");
  const confirmPw = watch("confirmPassword");
  const passwordsMatch = newPw && confirmPw && newPw === confirmPw;

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setBusy(true);
    try {
      await resetPassword({ token: values.token, newPassword: values.newPassword });
      setDone(true);
      toast.success("Password reset! Redirecting to sign in…");
      setTimeout(() => router.replace("/login"), 2000);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Reset failed. The token may have expired.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ff-auth">
      <section className="ff-auth__cover">
        <span className="ledger" aria-hidden />
        <div>
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-70">
            FinanceFlow · vol. 01
          </span>
          <p className="quote mt-6">
            New key,
            <br />
            <em>fresh access.</em>
            <br />
            <span className="text-canvas/60">Back in business.</span>
          </p>
        </div>
        <p className="attribution">FF Editorial · Karachi, 2026</p>
      </section>

      <section className="ff-auth__panel">
        <div className="ff-auth__form">
          <span className="editorial-rule">Set new password</span>
          <h1>Choose a new password.</h1>
          <p className="lede">
            Paste your reset token and choose a strong password. The token expires in 1 hour.
          </p>

          {done ? (
            <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-5 flex items-center gap-3">
              <span className="h-9 w-9 rounded-full bg-emerald/15 grid place-items-center shrink-0">
                <Check className="h-4 w-4 text-emerald" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Password updated!</p>
                <p className="text-xs text-muted mt-0.5">Redirecting you to sign in…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Token field */}
              <Input
                label="Reset token"
                placeholder="Paste your reset token here"
                leading={<KeyRound className="h-3.5 w-3.5" />}
                error={errors.token?.message}
                {...register("token")}
              />

              {/* New password */}
              <Input
                label="New password"
                type={showNew ? "text" : "password"}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                leading={<Lock className="h-3.5 w-3.5" />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    tabIndex={-1}
                    className="text-muted hover:text-ink transition-colors cursor-pointer"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                }
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />

              {/* Confirm password */}
              <div className="space-y-1">
                <Input
                  label="Confirm new password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  leading={<Lock className="h-3.5 w-3.5" />}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                      className="text-muted hover:text-ink transition-colors cursor-pointer"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  }
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
                {newPw && confirmPw && (
                  <p
                    className={`font-mono text-[10px] tracking-wide flex items-center gap-1 ${passwordsMatch ? "text-emerald" : "text-terra"}`}
                  >
                    {passwordsMatch ? (
                      <>
                        <Check className="h-3 w-3" /> Passwords match
                      </>
                    ) : (
                      "Passwords do not match"
                    )}
                  </p>
                )}
              </div>

              <Button type="submit" variant="primary" loading={busy} size="lg" className="w-full">
                Reset password
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <p className="text-xs text-muted mt-4">
            Back to{" "}
            <Link href="/login" className="text-gold underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default ResetPasswordView;
