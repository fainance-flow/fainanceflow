import { Redirect, Stack } from "expo-router";
import { colors, typography } from "@/constants/theme";
import { useAppSelector } from "@/hooks/useTypedRedux";

export default function AuthLayout() {
  const status = useAppSelector((s) => s.auth.status);

  // Mirrors the web's auth layout: a signed-in user shouldn't land back on
  // login/register/reset screens.
  if (status === "authenticated") {
    return <Redirect href="/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          color: colors.ink,
          fontFamily: typography.family.sansSemiBold,
          fontSize: typography.size.lg,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Sign in" }} />
      <Stack.Screen name="register" options={{ title: "Create account" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Reset password" }} />
      <Stack.Screen name="reset-password" options={{ title: "New password" }} />
    </Stack>
  );
}
