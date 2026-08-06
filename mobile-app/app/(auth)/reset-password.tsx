import { useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import Banner from "@/components/ui/Banner";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/schemas/auth";
import { resetPassword } from "@/services/auth";
import { colors, spacing, typography } from "@/constants/theme";

type ApiError = { response?: { data?: { message?: string } } };

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: params.token ?? "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordFormValues): Promise<void> => {
    setBusy(true);
    setServerError(null);
    try {
      await resetPassword({ token: values.token, newPassword: values.newPassword });
      setDone(true);
    } catch (err) {
      const message =
        (err as ApiError)?.response?.data?.message ?? "That reset token is invalid or has expired.";
      setServerError(message);
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
              <Text style={styles.eyebrow}>New password</Text>
            </View>
            <Text style={styles.headline}>Choose a new password.</Text>
          </View>

          {serverError ? <Banner variant="error">{serverError}</Banner> : null}

          {done ? (
            <>
              <Banner variant="success">Password reset successfully. Sign in with your new password.</Banner>
              <Link href="/login" asChild>
                <Button variant="primary" size="lg" style={styles.submit}>
                  Back to sign in
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Controller
                control={control}
                name="token"
                render={({ field }) => (
                  <TextField
                    label="Reset token"
                    placeholder="Paste the token from the previous screen"
                    autoCapitalize="none"
                    autoCorrect={false}
                    leading={<Ionicons name="key-outline" size={16} color={colors.faint} />}
                    error={errors.token?.message}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <Controller
                control={control}
                name="newPassword"
                render={({ field }) => (
                  <TextField
                    label="New password"
                    placeholder="•••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    leading={<Ionicons name="lock-closed-outline" size={16} color={colors.faint} />}
                    trailing={
                      <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={16}
                          color={colors.faint}
                        />
                      </Pressable>
                    }
                    error={errors.newPassword?.message}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <TextField
                    label="Confirm password"
                    placeholder="•••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    leading={<Ionicons name="lock-closed-outline" size={16} color={colors.faint} />}
                    error={errors.confirmPassword?.message}
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
                Reset password
              </Button>
            </>
          )}

          <View style={styles.switchRow}>
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
  submit: { marginTop: spacing.sm },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.sm },
  switchLink: { fontFamily: typography.family.sansSemiBold, fontSize: typography.size.sm, color: colors.primary },
});
