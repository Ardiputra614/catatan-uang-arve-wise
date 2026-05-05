// app/_layout.tsx
import { initDatabase } from "@/lib/database";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({});
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (e) {
        console.error("DB init error:", e);
      } finally {
        if (loaded) {
          await SplashScreen.hideAsync();
        }
      }
    };
    setup();
  }, [loaded]);

  // Jangan render Stack sampai DB & font siap
  if (!loaded || !dbReady) return null;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#0F172A" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="transaction/add"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="transaction/edit"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="transaction/detail"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack>
      <Toast />
    </View>
  );
}
