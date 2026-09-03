import { Redirect, Stack } from "expo-router";
import { colors, typography } from "@/constants/theme";
import { useAppSelector } from "@/hooks/useTypedRedux";
import LoadingScreen from "@/components/ui/LoadingScreen";

const stackHeader = {
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
};

export default function ProtectedLayout() {
  const status = useAppSelector((s) => s.auth.status);

  if (status === "idle" || status === "authenticating") {
    return <LoadingScreen />;
  }

  if (status === "anonymous") {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="expenses"
        options={{ ...stackHeader, title: "Expenses", headerShown: true }}
      />
      <Stack.Screen name="goals" options={{ ...stackHeader, title: "Goals", headerShown: true }} />
      <Stack.Screen
        name="subscriptions"
        options={{ ...stackHeader, title: "Subscriptions", headerShown: true }}
      />
      <Stack.Screen name="loans" options={{ ...stackHeader, title: "Loans", headerShown: true }} />
      <Stack.Screen
        name="settings"
        options={{ ...stackHeader, title: "Settings", headerShown: true }}
      />
    </Stack>
  );
}
