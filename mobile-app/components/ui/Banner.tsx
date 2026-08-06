import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/constants/theme";

type Variant = "success" | "error";

type Props = {
  variant: Variant;
  children: React.ReactNode;
};

/** Small inline success/error banner, shown above the submit button on auth screens. */
export default function Banner({ variant, children }: Props) {
  const isError = variant === "error";
  const tint = isError ? colors.terra : colors.emerald;

  return (
    <View style={[styles.base, { borderColor: tint, backgroundColor: isError ? "rgba(246,70,93,0.08)" : "rgba(14,203,129,0.08)" }]}>
      <Text style={[styles.text, { color: tint }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: { fontSize: typography.size.sm, fontFamily: typography.family.sansMedium },
});
