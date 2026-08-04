import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.box}>
        <Text style={styles.title}>Nothing here.</Text>
        <Text style={styles.body}>That route doesn’t exist in FinanceFlow Mobile.</Text>
        <Link href="/dashboard" style={styles.link}>
          Back to dashboard
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  box: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  body: { color: colors.muted, marginTop: spacing.sm, fontSize: 14 },
  link: { marginTop: spacing.lg, color: colors.primary, fontSize: 15, fontWeight: "600" },
});
