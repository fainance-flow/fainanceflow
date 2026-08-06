import { forwardRef, useState } from "react";
import { View, TextInput, Text, StyleSheet, type TextInputProps } from "react-native";
import { colors, radii, spacing, typography } from "@/constants/theme";

type Props = TextInputProps & {
  label: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

/** Labeled input with mono uppercase label, icon slots, and an error row — mirrors web's Input component. */
const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, leading, trailing, style, onFocus, onBlur, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.faint}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.faint,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
  },
  fieldFocused: { borderColor: colors.primary },
  fieldError: { borderColor: colors.terra },
  leading: { marginRight: spacing.sm },
  trailing: { marginLeft: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontFamily: typography.family.sans,
    fontSize: typography.size.base,
    color: colors.ink,
  },
  error: { color: colors.terra, fontSize: typography.size.xs },
});
