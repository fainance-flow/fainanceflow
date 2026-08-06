import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import Banner from "@/components/ui/Banner";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/schemas/auth";
import { forgotPassword } from "@/services/auth";
import { colors, radii, spacing, typography } from "@/constants/theme";

/**
 * Backend has no real email sending — POST /auth/forgot-password returns the
 * reset token directly in dev mode (see backend/src/routes/auth.ts). We
 * mirror the web app's ForgotPasswordView by surfacing that token inline
 * (selectable, long-press to copy) rather than pretending an email was sent,
 * and link straight into reset-password.tsx so the flow is completable here.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues): Promise<void> => {
    setBusy(true);
    setServerError(null);
    setInfoMessage(null);
    try {
      const res = await forgotPassword(values.email);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      } else {
        setInfoMessage(res.data.message ?? "If that email is registered, a reset token has been issued.");
      }
    } catch {
      setServerError("Couldn't process that request. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Logo variant="wordmark" size={36} />

          <View style={styles.hero}>
            <View style={styles.eyebrowRow}>
              <View style={styles.rule} />
              <Text style={styles.eyebrow}>Account recovery</Text>
            </View>
            <Text style={styles.headline}>Reset your password.</Text>
            <Text style={styles.lede}>
              Enter the email tied to your account and we&apos;ll generate a reset token for you.
            </Text>
          </View>

          {serverError ? <Banner variant="error">{serverError}</Banner> : null}
          {infoMessage ? <Banner variant="success">{infoMessage}</Banner> : null}

          {resetToken === null ? (
            <>
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <TextField
                    label="Email"
                    placeholder="you@example.pk"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    leading={<Ionicons name="mail-outline" size={16} color={colors.faint} />}
                    error={errors.email?.message}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <Button
                variant="primary"
                size="lg"
                loading={busy}
                onPress={handleSubmit(onSubmit)}
                style={styles.submit}
              >
                Send reset token
              </Button>
            </>
          ) : (
            <View style={styles.tokenCard}>
              <View style={styles.tokenHeader}>
                <Ionicons name="key-outline" size={16} color={colors.primary} />
                <Text style={styles.tokenLabel}>Dev mode — reset token</Text>
              </View>
              <Text style={styles.tokenValue} selectable>
                {resetToken}
              </Text>
              <Text style={styles.tokenHint}>Long-press the token above to copy it.</Text>
              <Text style={styles.tokenExpiry}>
                This token expires in <Text style={styles.tokenExpiryStrong}>1 hour</Text>.
              </Text>
              <Button
                variant="primary"
                size="lg"
                style={styles.submit}
                onPress={() => router.push({ pathname: "/reset-password", params: { token: resetToken } })}
              >
                Continue to reset password
              </Button>
            </View>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Remembered it? </Text>
            <Link href="/login" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.switchLink}>Back to sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.xl, gap: spacing.lg },
  hero: { gap: spacing.sm, marginTop: spacing.md },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rule: { width: 20, height: 2, backgroundColor: colors.primary },
  eyebrow: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.faint,
  },
  headline: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.xxl,
    color: colors.ink,
  },
  lede: {
    fontFamily: typography.family.sans,
    fontSize: typography.size.base,
    lineHeight: 22,
    color: colors.muted,
  },
  submit: { marginTop: spacing.sm },
  tokenCard: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "rgba(252,213,53,0.06)",
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tokenHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tokenLabel: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.primary,
  },
  tokenValue: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.sm,
    color: colors.ink,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    lineHeight: 20,
  },
  tokenHint: { fontFamily: typography.family.sans, fontSize: typography.size.xs, color: colors.faint },
  tokenExpiry: { fontFamily: typography.family.sans, fontSize: typography.size.xs, color: colors.muted },
  tokenExpiryStrong: { fontFamily: typography.family.sansSemiBold, color: colors.ink },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.sm },
  switchText: { fontFamily: typography.family.sans, fontSize: typography.size.sm, color: colors.muted },
  switchLink: { fontFamily: typography.family.sansSemiBold, fontSize: typography.size.sm, color: colors.primary },
});
