"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import StoreProvider from "@provider/StoreProvider";
import QueryProvider from "@provider/QueryProvider";
import ServiceWorkerRegister from "@components/providers/ServiceWorkerRegister";

type Props = {
  children: React.ReactNode;
};

const AppProviders = ({ children }: Props) => {
  return (
    <StoreProvider>
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ServiceWorkerRegister />
          {children}
          <Toaster
            position="bottom-right"
            theme="system"
            toastOptions={{
              classNames: {
                toast:
                  "!bg-surface !border !border-line !text-ink !shadow-soft !font-sans !rounded-xl",
                title: "!text-ink !font-medium",
                description: "!text-muted !text-xs",
                success: "!text-emerald",
                error: "!text-terra",
              },
            }}
          />
        </ThemeProvider>
      </QueryProvider>
    </StoreProvider>
  );
};

export default AppProviders;
