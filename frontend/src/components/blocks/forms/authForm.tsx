"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowRight,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  HardDriveDownload,
} from "lucide-react";
import Link from "next/link";
import Input from "@components/common/Input";
import Button from "@components/common/Button";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@schemas/auth";
import { login, register } from "@services/auth";
import { tokenStore } from "@libs/axios";
import { useAppDispatch } from "@hooks/useTypedRedux";
import { authSuccess } from "@store/slices/authSlice";
import { useContinueOffline } from "@hooks/useAuth";
import { cacheUser } from "@/lib/local-session";

type Mode = "login" | "register";

type Props = {
  mode?: Mode;
  demoEmail?: string;
  demoPassword?: string;
};

type FormValues = LoginFormValues & Partial<Pick<RegisterFormValues, "name">>;

const AuthForm = ({ mode = "login", demoEmail, demoPassword }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const continueOffline = useContinueOffline();
  const [busy, setBusy] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const schema = mode === "login" ? loginSchema : registerSchema;

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: demoEmail ?? "",
      password: demoPassword ?? "",
      ...(mode === "register" ? { name: "" } : {}),
    },
  });

  const onSubmit = async (values: FormValues): Promise<void> => {
    setBusy(true);
    try {
      const res =
        mode === "login"
          ? await login({ email: values.email, password: values.password })
          : await register({
              name: values.name ?? "",
              email: values.email,
              password: values.password,
            });
      tokenStore.set(res.data.accessToken, res.data.refreshToken);
      dispatch(authSuccess(res.data.user));
      cacheUser(res.data.user);
      toast.success(`Welcome back, ${res.data.user.name.split(" ")[0]}.`);
      router.replace("/dashboard");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Couldn't sign in. Check your credentials.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {mode === "register" && (
        <Input
          label="Name"
          placeholder="Aisha Khan"
          autoComplete="name"
          leading={<UserIcon className="h-3.5 w-3.5" />}
          error={errors.name?.message}
          {...registerField("name")}
        />
      )}
      <Input
        label="Email"
        type="email"
        placeholder="you@example.pk"
        autoComplete="email"
        leading={<Mail className="h-3.5 w-3.5" />}
        error={errors.email?.message}
        {...registerField("email")}
      />
      <div className="space-y-1">
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="•••••••"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          leading={<Lock className="h-3.5 w-3.5" />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="text-muted hover:text-ink transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          }
          error={errors.password?.message}
          {...registerField("password")}
        />
        {mode === "login" && (
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="font-mono text-[10px] tracking-wide text-muted hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        )}
      </div>

      <Button type="submit" variant="primary" loading={busy} size="lg" className="w-full">
        {mode === "login" ? "Sign in" : "Create account"}
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="ff-auth__divider" role="separator">
        <span>or</span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => continueOffline()}
      >
        <HardDriveDownload className="h-4 w-4" />
        Continue offline — stays in this browser
      </Button>
    </form>
  );
};

export default AuthForm;
