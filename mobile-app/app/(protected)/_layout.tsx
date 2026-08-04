import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

const stackHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.ink, fontWeight: "600" as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.canvas },
};

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="expenses" options={{ ...stackHeader, title: "Expenses", headerShown: true }} />
      <Stack.Screen name="goals" options={{ ...stackHeader, title: "Goals", headerShown: true }} />
      <Stack.Screen name="subscriptions" options={{ ...stackHeader, title: "Subscriptions", headerShown: true }} />
      <Stack.Screen name="loans" options={{ ...stackHeader, title: "Loans", headerShown: true }} />
      <Stack.Screen name="settings" options={{ ...stackHeader, title: "Settings", headerShown: true }} />
    </Stack>
  );
}
