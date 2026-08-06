/** Design tokens aligned with FinanceFlow web (dark-first, Binance-inspired). */

export const colors = {
  // Base surfaces — matches frontend/src/assets/scss/global.scss `.dark` block exactly.
  canvas: "#0b0e11",
  surface: "#1e2329",
  surface2: "#2b3139",
  surface3: "#181c21",
  line: "#2b3139",
  lineStrong: "#474d57",

  // Text
  ink: "#ffffff",
  muted: "#eaecef",
  faint: "#929aa5",

  // Brand — Binance yellow, identical across themes
  primary: "#fcd535",
  primaryActive: "#f0b90b",
  onPrimary: "#181a20",
  gold: "#fcd535",

  // Trading / status semantics
  emerald: "#0ecb81",
  terra: "#f6465d",
  warning: "#f0b90b",
  info: "#3b82f6",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

/** Corner radius scale — matches frontend/src/assets/scss/utils/_variables.scss. */
export const radii = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  pill: 9999,
} as const;

/**
 * Type scale — sizes match the web's $font-size-* SCSS tokens (px).
 * `family` values MUST be strings matching the keys passed to `useFonts()`
 * in app/_layout.tsx. Passing the font module objects here crashes Android
 * TextInput (ClassCastException: Double cannot be cast to String).
 */
export const typography = {
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
    display: 48,
  },
  family: {
    sans: "Inter_400Regular",
    sansMedium: "Inter_500Medium",
    sansSemiBold: "Inter_600SemiBold",
    sansBold: "Inter_700Bold",
    mono: "JetBrainsMono_400Regular",
    monoSemiBold: "JetBrainsMono_600SemiBold",
  },
} as const;
