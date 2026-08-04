"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@hooks/useTypedRedux";
import { useHydrateUser } from "@hooks/useAuth";
import ThemeSwitch from "@components/common/ThemeSwitch";

type Props = {
  children: React.ReactNode;
};

const AuthLayout = ({ children }: Props) => {
  const router = useRouter();
  const status = useAppSelector((s) => s.auth.status);
  useHydrateUser();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  return (
    <div className="relative z-10">
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitch />
      </div>
      {children}
    </div>
  );
};

export default AuthLayout;
