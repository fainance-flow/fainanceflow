import { Link } from "expo-router";
import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/constants/theme";

const MORE_LINKS: { href: "/expenses" | "/goals" | "/subscriptions" | "/loans" | "/settings"; label: string }[] = [
  { href: "/expenses", label: "Expenses" },
  { href: "/goals", label: "Goals" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/loans", label: "Loans" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.sub}>Summary cards and charts will port from dashboardView.tsx.</Text>
        <Text style={styles.section}>More</Text>
        <View style={styles.grid}>
          {MORE_LINKS.map((item) => (
            <Link key={item.href} href={item.href} asChild>
              <Pressable style={styles.chip} hitSlop={6}>
                <Text style={styles.chipText}>{item.label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  title: { color: colors.ink, fontSize: 26, fontWeight: "700" },
  sub: { color: colors.muted, marginTop: spacing.sm, fontSize: 14, lineHeight: 20 },
  section: {
    marginTop: spacing.xl,
    color: colors.faint,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: { color: colors.ink, fontSize: 14, fontWeight: "600" },
});
