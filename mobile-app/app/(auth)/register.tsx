import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/constants/theme";

export default function RegisterScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <View style={styles.inner}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.lead}>Registration form will mirror the Next.js auth flow.</Text>
        <Link href="/login" asChild>
          <Pressable hitSlop={10}>
            <Text style={styles.link}>Already have an account?</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  inner: { flex: 1, padding: spacing.xl, gap: spacing.md },
  title: { color: colors.ink, fontSize: 22, fontWeight: "700" },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  link: { color: colors.primary, fontWeight: "600", fontSize: 15 },
});
