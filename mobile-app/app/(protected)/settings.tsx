import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Banner from "@/components/ui/Banner";
import { logout } from "@/services/auth";
import { tokenStore } from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/hooks/useTypedRedux";
import { authClear } from "@/store/slices/authSlice";
import { colors, spacing, typography } from "@/constants/theme";

export default function SettingsStackScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await logout();
    } catch {
      // Swallowed — we clear local state below regardless of transport errors,
      // same as the web app's useLogout hook.
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

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom", "top"]}>
      <View style={styles.inner}>
        <Logo size={40} />
        <Text style={styles.title}>Settings</Text>
        {user ? (
          <Text style={styles.subtitle}>
            {user.name} · {user.email}
          </Text>
        ) : null}
        <Text style={styles.hint}>Screen scaffold — port feature UI from frontend.</Text>

        {error ? <Banner variant="error">{error}</Banner> : null}

        <Button variant="outline" size="lg" loading={busy} onPress={handleLogout} style={styles.logout}>
          Log out
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  inner: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, gap: spacing.md },
  title: {
    color: colors.ink,
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.xl,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  subtitle: { color: colors.muted, fontFamily: typography.family.sans, fontSize: typography.size.sm },
  hint: {
    color: colors.faint,
    fontFamily: typography.family.sans,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  logout: { marginTop: spacing.md, alignSelf: "flex-start" },
});
