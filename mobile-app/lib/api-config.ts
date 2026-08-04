import Constants from "expo-constants";

type Extra = {
  apiUrl?: string;
};

export function getApiUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as Extra | undefined)?.apiUrl;
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  return (fromExtra || fromEnv || "http://localhost:4000/api").replace(/\/$/, "");
}
