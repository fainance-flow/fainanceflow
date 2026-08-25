import Constants from "expo-constants";
import { Platform } from "react-native";

type Extra = {
  apiUrl?: string;
};

const DEFAULT = "http://localhost:4000/api";

/**
 * Resolve API base URL for dev builds.
 * - Android emulator → 10.0.2.2 (host machine; LAN IP in .env often goes stale)
 * - iOS simulator → localhost
 * - Physical device (Expo Go / real phone) → EXPO_PUBLIC_API_URL (PC LAN IP)
 */
export function getApiUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as Extra | undefined)?.apiUrl;
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const configured = (fromExtra || fromEnv || DEFAULT).replace(/\/$/, "");

  if (Constants.isDevice) {
    return configured;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000/api";
  }

  if (Platform.OS === "ios") {
    return "http://localhost:4000/api";
  }

  return configured;
}
