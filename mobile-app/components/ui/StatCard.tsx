import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/constants/theme";

type Tone = "neutral" | "emerald" | "terra" | "primary";

type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
};

const toneColor: Record<Tone, string> = {
  neutral: colors.ink,
  emerald: colors.emerald,
  terra: colors.terra,
  primary: colors.primary,
};

export default function StatCard({ label, value, hint, tone = "neutral" }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: toneColor[tone] }]}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.faint,
  },
  value: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.lg,
  },
  hint: {
    fontFamily: typography.family.sans,
    fontSize: typography.size.xs,
    color: colors.muted,
  },
});
