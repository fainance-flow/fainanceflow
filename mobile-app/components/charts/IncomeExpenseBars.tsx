import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import type { ChartPoint } from "@/utils/types";
import { colors, radii, spacing, typography } from "@/constants/theme";

type Props = {
  data: ChartPoint[];
  height?: number;
};

export default function IncomeExpenseBars({ data, height = 140 }: Props) {
  if (!data.length) {
    return (
      <View style={[styles.wrap, { height }]}>
        <Text style={styles.empty}>No chart data yet</Text>
      </View>
    );
  }

  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const barW = 10;
  const gap = 18;
  const groupW = barW * 2 + 4;
  const width = Math.max(data.length * (groupW + gap), 280);

  return (
    <View style={styles.wrap}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.emerald }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.terra }]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
      </View>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const x = i * (groupW + gap) + 8;
          const incH = (d.income / max) * (height - 28);
          const expH = (d.expense / max) * (height - 28);
          return (
            <React.Fragment key={`${d.year}-${d.month}`}>
              <Rect
                x={x}
                y={height - 20 - incH}
                width={barW}
                height={Math.max(incH, 1)}
                rx={2}
                fill={colors.emerald}
              />
              <Rect
                x={x + barW + 4}
                y={height - 20 - expH}
                width={barW}
                height={Math.max(expH, 1)}
                rx={2}
                fill={colors.terra}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={[styles.labels, { width }]}>
        {data.map((d) => (
          <Text key={`${d.label}-${d.month}`} style={[styles.label, { width: groupW + gap }]}>
            {d.label.slice(0, 3)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: spacing.md,
    overflow: "hidden",
  },
  empty: {
    color: colors.faint,
    fontFamily: typography.family.sans,
    fontSize: typography.size.sm,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  legend: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    color: colors.faint,
    textTransform: "uppercase",
  },
  labels: { flexDirection: "row", marginTop: 4 },
  label: {
    fontFamily: typography.family.mono,
    fontSize: 9,
    color: colors.faint,
    textAlign: "center",
  },
});
