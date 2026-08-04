import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/constants/theme";

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <View style={styles.inner}>
        <Text style={styles.mark}>
          <Text style={styles.markAccent}>f</Text>
          <Text style={styles.markRest}> FinanceFlow</Text>
        </Text>
        <Text style={styles.lead}>Sign in (UI to be ported from web).</Text>
        <Link href="/register" asChild>
          <Pressable style={styles.secondary} hitSlop={10}>
            <Text style={styles.secondaryText}>Create an account</Text>
          </Pressable>
        </Link>
        <Link href="/dashboard" asChild>
          <Pressable style={styles.primary} hitSlop={10}>
            <Text style={styles.primaryText}>Continue to app (dev)</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  inner: { flex: 1, padding: spacing.xl, justifyContent: "center", gap: spacing.lg },
  mark: { fontSize: 28, fontWeight: "800", color: colors.ink },
  markAccent: { color: colors.primary },
  markRest: { color: colors.ink },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  secondary: { alignSelf: "flex-start", paddingVertical: spacing.sm },
  secondaryText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  primary: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  primaryText: { color: colors.onPrimary, fontWeight: "700", fontSize: 15 },
});
