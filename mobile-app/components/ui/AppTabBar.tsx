import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { colors, radii, spacing, typography } from "@/constants/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

const TAB_META: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  dashboard: { label: "Home", icon: "home-outline", iconActive: "home" },
  accounts: { label: "Wallets", icon: "wallet-outline", iconActive: "wallet" },
  transactions: { label: "Activity", icon: "list-outline", iconActive: "list" },
  budget: { label: "Budget", icon: "pie-chart-outline", iconActive: "pie-chart" },
  more: { label: "More", icon: "menu-outline", iconActive: "menu" },
};

export default function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  const visibleRoutes = state.routes.filter((route) => {
    const opts = descriptors[route.key]?.options;
    // Hide screens with href: null (e.g. reports)
    if (opts && "href" in opts && (opts as { href?: unknown }).href === null) return false;
    return Boolean(TAB_META[route.name]);
  });

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <View style={styles.bar}>
        {visibleRoutes.map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === index;
          const meta = TAB_META[route.name];
          if (!meta) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={meta.label}
              onPress={onPress}
              style={styles.item}
              hitSlop={6}
            >
              <View style={[styles.iconSlot, focused && styles.iconSlotActive]}>
                <Ionicons
                  name={focused ? meta.iconActive : meta.icon}
                  size={20}
                  color={focused ? colors.onPrimary : colors.faint}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
    paddingTop: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  iconSlot: {
    width: 44,
    height: 32,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSlotActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontFamily: typography.family.sansMedium,
    fontSize: 10,
    letterSpacing: 0.2,
    color: colors.faint,
  },
  labelActive: {
    fontFamily: typography.family.sansSemiBold,
    color: colors.primary,
  },
});
