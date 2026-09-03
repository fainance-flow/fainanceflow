import { useState } from "react";
import { Link, useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import Banner from "@/components/ui/Banner";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import { login } from "@/services/auth";
import { tokenStore } from "@/lib/axios";
import { useAppDispatch } from "@/hooks/useTypedRedux";
import { authSuccess } from "@/store/slices/authSlice";
import { colors, spacing, typography } from "@/constants/theme";

type ApiError = { response?: { data?: { message?: string } }; message?: string; code?: string };

function loginErrorMessage(err: unknown): string {
  const e = err as ApiError;
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.code === "ECONNABORTED") return "Request timed out. Is the backend running?";
  if (e?.message === "Network Error" || e?.code === "ERR_NETWORK") {
    return "Can't reach the server. On a phone, use the same Wi‑Fi as your PC and check EXPO_PUBLIC_API_URL in mobile-app/.env.";
  }
  return "Couldn't sign in. Check your credentials.";
}

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setBusy(true);
    setServerError(null);
    try {
      const res = await login(values);
      await tokenStore.set(res.data.accessToken, res.data.refreshToken);
      dispatch(authSuccess(res.data.user));
      router.replace("/dashboard");
    } catch (err) {
      const message = loginErrorMessage(err);
      setServerError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Logo variant="wordmark" size={36} />

          <View style={styles.hero}>
            <View style={styles.eyebrowRow}>
              <View style={styles.rule} />
              <Text style={styles.eyebrow}>Welcome back</Text>
            </View>
            <Text style={styles.headline}>Sign in to your ledger.</Text>
            <Text style={styles.lede}>
              Track every rupee — across every wallet you carry. PKR, formatted right.
            </Text>
          </View>

          {serverError ? <Banner variant="error">{serverError}</Banner> : null}

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

          <View style={styles.passwordGroup}>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextField
                  label="Password"
                  placeholder="•••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
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
                  error={errors.password?.message}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            <Link href="/forgot-password" asChild>
              <Pressable hitSlop={8} style={styles.forgotLink}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </Link>
          </View>

          <Button
            variant="primary"
            size="lg"
            loading={busy}
            onPress={handleSubmit(onSubmit)}
            style={styles.submit}
          >
            Sign in
          </Button>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>New here? </Text>
            <Link href="/register" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.switchLink}>Create an account</Text>
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
  passwordGroup: { gap: spacing.xs },
  forgotLink: { alignSelf: "flex-end" },
  forgotText: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    color: colors.faint,
  },
  submit: { marginTop: spacing.sm },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.sm },
  switchText: {
    fontFamily: typography.family.sans,
    fontSize: typography.size.sm,
    color: colors.muted,
  },
  switchLink: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.sm,
    color: colors.primary,
  },
});
