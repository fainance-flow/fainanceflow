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
import { registerSchema, type RegisterFormValues } from "@/schemas/auth";
import { register as registerRequest } from "@/services/auth";
import { tokenStore } from "@/lib/axios";
import { useAppDispatch } from "@/hooks/useTypedRedux";
import { authSuccess } from "@/store/slices/authSlice";
import { colors, spacing, typography } from "@/constants/theme";

type ApiError = { response?: { data?: { message?: string } } };

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    setBusy(true);
    setServerError(null);
    try {
      const res = await registerRequest(values);
      // Auto-login: register already returns a full token pair, same as login.
      await tokenStore.set(res.data.accessToken, res.data.refreshToken);
      dispatch(authSuccess(res.data.user));
      router.replace("/dashboard");
    } catch (err) {
      const message =
        (err as ApiError)?.response?.data?.message ?? "Couldn't create your account. Try again.";
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
              <Text style={styles.eyebrow}>New account</Text>
            </View>
            <Text style={styles.headline}>Start your ledger.</Text>
            <Text style={styles.lede}>
              Track every rupee — across every wallet you carry. PKR, formatted right.
            </Text>
          </View>

          {serverError ? <Banner variant="error">{serverError}</Banner> : null}

          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                label="Name"
                placeholder="Enter your User Name"
                autoComplete="name"
                leading={<Ionicons name="person-outline" size={16} color={colors.faint} />}
                error={errors.name?.message}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextField
                label="Email"
                placeholder="Enter your email"
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

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextField
                label="Password"
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
                error={errors.password?.message}
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
            Create account
          </Button>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.switchLink}>Sign in</Text>
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
