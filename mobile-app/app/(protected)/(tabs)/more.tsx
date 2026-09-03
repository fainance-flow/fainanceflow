import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import QuickAddModal, { type QuickAddKind } from "@/components/QuickAddModal";
import Banner from "@/components/ui/Banner";
import { logout } from "@/services/auth";
import { tokenStore } from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/hooks/useTypedRedux";
import { authClear } from "@/store/slices/authSlice";
import { colors, radii, spacing, typography } from "@/constants/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

const QUICK: { kind: QuickAddKind; label: string; hint: string; icon: IconName; tone: string }[] = [
  {
    kind: "expense",
    label: "Expense",
    hint: "Money out",
    icon: "arrow-up-outline",
    tone: colors.terra,
  },
  {
    kind: "income",
    label: "Income",
    hint: "Money in",
    icon: "arrow-down-outline",
    tone: colors.emerald,
  },
  {
    kind: "transfer",
    label: "Transfer",
    hint: "Between wallets",
    icon: "swap-horizontal-outline",
    tone: colors.primary,
  },
  {
    kind: "budget",
    label: "Budget",
    hint: "Monthly limit",
    icon: "pie-chart-outline",
    tone: colors.muted,
  },
  {
    kind: "account",
    label: "Wallet",
    hint: "New wallet",
    icon: "wallet-outline",
    tone: colors.muted,
  },
];

const LINKS: {
  href: "/reports" | "/goals" | "/subscriptions" | "/loans" | "/settings" | "/expenses";
  label: string;
  hint: string;
  icon: IconName;
}[] = [
  { href: "/reports", label: "Reports", hint: "Trends & categories", icon: "bar-chart-outline" },
  { href: "/goals", label: "Goals", hint: "Savings targets", icon: "flag-outline" },
  { href: "/expenses", label: "Expenses", hint: "Expense view", icon: "receipt-outline" },
  {
    href: "/subscriptions",
    label: "Subscriptions",
    hint: "Recurring bills",
    icon: "repeat-outline",
  },
  { href: "/loans", label: "Loans", hint: "Borrow & lend", icon: "cash-outline" },
  { href: "/settings", label: "Settings", hint: "Account preferences", icon: "settings-outline" },
];

export default function MoreScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quick, setQuick] = useState<{ open: boolean; kind: QuickAddKind }>({
    open: false,
    kind: "expense",
  });

  const handleLogout = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await logout();
    } catch {
      // Clear local session even if API fails (same as web / Settings).
    }
    try {
      await tokenStore.clear();
      dispatch(authClear());
      router.replace("/login");
    } catch {
      setError("Couldn't log out. Try again.");
      setBusy(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Log out", "Sign out of FinanceFlow on this device?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void handleLogout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.sub}>
          Quick add money moves, or open tools that don&apos;t fit the tab bar.
        </Text>

        {user ? (
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user.name?.[0] ?? "U").toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.section}>Quick add</Text>
        <View style={styles.quickGrid}>
          {QUICK.map((q) => (
            <Pressable
              key={q.kind}
              style={styles.quickCard}
              onPress={() => setQuick({ open: true, kind: q.kind })}
              hitSlop={4}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${q.tone}22` }]}>
                <Ionicons name={q.icon} size={20} color={q.tone} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
              <Text style={styles.quickHint}>{q.hint}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>View more</Text>
        <View style={styles.linkList}>
          {LINKS.map((item) => (
            <Link key={item.href} href={item.href} asChild>
              <Pressable style={styles.linkRow} hitSlop={4}>
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkLabel}>{item.label}</Text>
                  <Text style={styles.linkHint}>{item.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.faint} />
              </Pressable>
            </Link>
          ))}
        </View>

        <Text style={styles.section}>Account</Text>
        {error ? <Banner variant="error">{error}</Banner> : null}
        <Pressable
          style={[styles.logoutRow, busy && styles.logoutDisabled]}
          onPress={confirmLogout}
          disabled={busy}
          hitSlop={4}
        >
          <View style={[styles.iconWrap, styles.logoutIcon]}>
            <Ionicons name="log-out-outline" size={20} color={colors.terra} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoutLabel}>{busy ? "Signing out…" : "Log out"}</Text>
            <Text style={styles.linkHint}>End session on this device</Text>
          </View>
        </Pressable>
      </ScrollView>

      <QuickAddModal
        open={quick.open}
        initial={quick.kind}
        onClose={() => setQuick((p) => ({ ...p, open: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md },
  title: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.xxl,
    color: colors.ink,
  },
  sub: {
    fontFamily: typography.family.sans,
    fontSize: typography.size.sm,
    color: colors.faint,
    marginBottom: spacing.sm,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.lg,
    color: colors.onPrimary,
  },
  userName: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.base,
    color: colors.ink,
  },
  userEmail: {
    fontFamily: typography.family.sans,
    fontSize: typography.size.xs,
    color: colors.faint,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.sm,
    color: colors.faint,
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  quickCard: {
    width: "31%",
    minWidth: 100,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  quickLabel: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.sm,
    color: colors.ink,
  },
  quickHint: {
    fontFamily: typography.family.mono,
    fontSize: 9,
    color: colors.faint,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  linkList: { gap: spacing.sm },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  linkLabel: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.base,
    color: colors.ink,
  },
  linkHint: {
    fontFamily: typography.family.sans,
    fontSize: typography.size.xs,
    color: colors.faint,
    marginTop: 2,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(246,70,93,0.08)",
    borderWidth: 1,
    borderColor: "rgba(246,70,93,0.35)",
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  logoutDisabled: { opacity: 0.6 },
  logoutIcon: { backgroundColor: "rgba(246,70,93,0.15)", marginBottom: 0 },
  logoutLabel: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.base,
    color: colors.terra,
  },
});
