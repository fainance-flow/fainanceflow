import { Redirect } from "expo-router";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useAppSelector } from "@/hooks/useTypedRedux";

export default function Index() {
  const status = useAppSelector((s) => s.auth.status);

  // useAuthBootstrap (run from SplashGate) always settles on "anonymous" or
  // "authenticated" before the splash screen hides — "idle"/"authenticating"
  // only appear for the brief window bootstrap is still in flight.
  if (status === "idle" || status === "authenticating") {
    return <LoadingScreen />;
  }

  return <Redirect href={status === "authenticated" ? "/dashboard" : "/login"} />;
}
