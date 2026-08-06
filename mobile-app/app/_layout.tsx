import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular, JetBrainsMono_600SemiBold } from "@expo-google-fonts/jetbrains-mono";
import AppProviders from "@/provider/index";
import SplashGate from "@/provider/SplashGate";

// Called at module scope, before the first render, per expo-splash-screen docs.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
  });

  // Keep the native splash up and render nothing until fonts resolve (or
  // fail) — avoids a flash of system-font text before Inter/JetBrains Mono
  // are ready.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProviders>
          <SplashGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(protected)" />
            </Stack>
          </SplashGate>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
