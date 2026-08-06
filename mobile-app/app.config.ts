import type { ExpoConfig } from "expo/config";

const scheme = "financeflow";

// Matches the dark navy behind the circular brand mark in assets/brand-logo.png
const canvasDark = "#0b0e11";

const config: ExpoConfig = {
  name: "FinanceFlow",
  slug: "financeflow-mobile",
  version: "1.0.0",
  orientation: "portrait",
  scheme,
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.financeflow.app",
    userInterfaceStyle: "dark",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: canvasDark,
    },
    package: "com.financeflow.app",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  // SDK 54: splash is configured via the expo-splash-screen plugin, not the
  // legacy top-level `splash` key.
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: canvasDark,
      },
    ],
  ],
  extra: {
    scheme,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api",
  },
};

export default config;
