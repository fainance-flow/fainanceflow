import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";

type Props = {
  children: React.ReactNode;
};

/**
 * Mounted inside AppProviders (so it has Redux access) once fonts have
 * resolved. Runs the auth bootstrap and hides the native splash screen only
 * once that finishes — so the app never flashes an unauthenticated screen
 * before we know whether a stored session is valid.
 */
export default function SplashGate({ children }: Props) {
  const { hydrated } = useAuthBootstrap();

  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [hydrated]);

  return <>{children}</>;
}
