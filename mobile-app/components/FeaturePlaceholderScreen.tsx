import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Logo from "@/components/ui/Logo";
import Skeleton from "@/components/ui/Skeleton";
import { colors, spacing, typography } from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
};

export default function FeaturePlaceholderScreen({ title, subtitle }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom", "top"]}>
      <View style={styles.inner}>
        <Logo size={36} />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.hint}>
          Coming soon — this screen is scaffolded, feature UI ports from the web app next.
        </Text>

        <View style={styles.skeletonGroup}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="100%" height={64} radius={16} />
          <Skeleton width="100%" height={64} radius={16} />
          <Skeleton width="40%" height={16} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  inner: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, gap: spacing.sm },
  title: {
    color: colors.ink,
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.xl,
    letterSpacing: -0.5,
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.family.sans,
    fontSize: typography.size.sm,
  },
  hint: {
    marginTop: spacing.md,
    color: colors.faint,
    fontFamily: typography.family.sans,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  skeletonGroup: { marginTop: spacing.xl, gap: spacing.md },
});
