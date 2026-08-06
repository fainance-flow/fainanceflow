import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import { colors, typography } from "@/constants/theme";

type Props = {
  /** Pixel size of the square mark. Defaults to 32, matching the web favicon. */
  size?: number;
  /** "mark" renders just the yellow square + "f" glyph. "wordmark" adds "FinanceFlow" text beside it. */
  variant?: "mark" | "wordmark";
  /** Override the wordmark text color (defaults to theme.colors.ink). */
  textColor?: string;
};

/**
 * The FinanceFlow brand mark, ported 1:1 from frontend/src/app/icon.svg
 * (yellow rounded-square + black lowercase "f") so mobile and web share the
 * exact same logo geometry instead of a re-drawn approximation.
 */
export default function Logo({ size = 32, variant = "mark", textColor }: Props) {
  const mark = (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect width={32} height={32} rx={7} fill={colors.primary} />
      <Path
        d="M20.5 9.5H14.9c-1.55 0-2.8 1.26-2.8 2.8V14h-1.9v3h1.9v6.5h3.1V17h3.2v-3h-3.2v-1.2c0-.44.36-.8.8-.8h4.5v-2.5Z"
        fill={colors.onPrimary}
      />
    </Svg>
  );

  if (variant === "mark") return mark;

  return (
    <View style={styles.row}>
      {mark}
      <Text style={[styles.wordmark, { color: textColor ?? colors.ink }]}>
        Finance
        <Text style={styles.wordmarkAccent}>Flow</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmark: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.lg,
  },
  wordmarkAccent: {
    fontFamily: typography.family.sansBold,
    color: colors.primary,
    fontStyle: "italic",
  },
});
