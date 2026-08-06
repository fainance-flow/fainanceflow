import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors, radii, spacing, typography } from "@/constants/theme";

type Variant = "primary" | "outline";
type Size = "md" | "lg";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Primary (solid yellow) / outline (hairline border) button, mirrors web's Button component behavior. */
export default function Button({
  children,
  onPress,
  variant = "primary",
  size = "lg",
  loading = false,
  disabled = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        size === "lg" ? styles.lg : styles.md,
        variant === "primary" ? styles.primary : styles.outline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.onPrimary : colors.primary} />
      ) : typeof children === "string" ? (
        <Text style={[styles.label, variant === "primary" ? styles.labelPrimary : styles.labelOutline]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.line },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { fontSize: typography.size.base, fontFamily: typography.family.sansSemiBold },
  labelPrimary: { color: colors.onPrimary },
  labelOutline: { color: colors.ink },
});
