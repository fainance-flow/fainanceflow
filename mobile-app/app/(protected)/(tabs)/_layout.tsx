import { Tabs } from "expo-router";
import AppTabBar from "@/components/ui/AppTabBar";

export default function ProtectedTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Home" }} />
      <Tabs.Screen name="accounts" options={{ title: "Wallets" }} />
      <Tabs.Screen name="transactions" options={{ title: "Activity" }} />
      <Tabs.Screen name="budget" options={{ title: "Budget" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
      {/* Hidden from tab bar — opened from More hub */}
      <Tabs.Screen name="reports" options={{ href: null }} />
    </Tabs>
  );
}
