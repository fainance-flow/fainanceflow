import type { ExpoConfig } from "expo/config";

const scheme = "financeflow";

const config: ExpoConfig = {
  name: "FinanceFlow",
  slug: "financeflow-mobile",
  version: "1.0.0",
  orientation: "portrait",
  scheme,
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#181a20",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.financeflow.app",
    userInterfaceStyle: "dark",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#181a20",
    },
    package: "com.financeflow.app",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-router", "expo-font"],
  extra: {
    scheme,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api",
  },
};

export default config;
