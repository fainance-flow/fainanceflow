"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, ArrowRight, Copy, Check, KeyRound } from "lucide-react";
import Link from "next/link";
import Input from "@components/common/Input";
import Button from "@components/common/Button";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@schemas/auth";
import { forgotPassword } from "@services/auth";

const ForgotPasswordView = () => {
  const [busy, setBusy] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setBusy(true);
    try {
      const res = await forgotPassword(values.email);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
        toast.success("Reset token generated — copy it below.");
      } else {
        toast.success(res.data.message);
      }
    } catch {
      toast.error("Could not process request. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!resetToken) return;
    await navigator.clipboard.writeText(resetToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            Forgot your key?
            <br />
            <span className="text-canvas/60">We&rsquo;ll get you back in.</span>
          </p>
        </div>
        <p className="attribution">FF Editorial · Karachi, 2026</p>
      </section>

      <section className="ff-auth__panel">
        <div className="ff-auth__form">
          <span className="editorial-rule">Account recovery</span>
          <h1>Reset your password.</h1>
          <p className="lede">
            Enter the email tied to your account and we&rsquo;ll generate a reset token for you.
          </p>

          {!resetToken ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.pk"
                autoComplete="email"
                leading={<Mail className="h-3.5 w-3.5" />}
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" variant="primary" loading={busy} size="lg" className="w-full">
                Send reset token
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Token display card */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <KeyRound className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase font-semibold">
                    Dev mode — reset token
                  </span>
                </div>
                <p className="font-mono text-xs text-ink break-all select-all leading-relaxed bg-surface-2 rounded-lg p-3 border border-line">
                  {resetToken}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy token
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted">
                This token expires in <strong className="text-ink">1 hour</strong>. Paste it on the reset screen below.
              </p>

              <Link href={`/reset-password?token=${resetToken}`}>
                <Button variant="primary" size="lg" className="w-full">
                  Continue to reset password
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          <p className="text-xs text-muted mt-4">
            Remembered it?{" "}
            <Link href="/login" className="text-gold underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default ForgotPasswordView;
