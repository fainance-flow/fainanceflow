import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Logo from "@/components/ui/Logo";
import { colors, spacing } from "@/constants/theme";

/** Full-screen branded loader — used during auth bootstrap and route transitions. */
export default function LoadingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Logo size={48} />
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg },
  spinner: { marginTop: spacing.sm },
});
