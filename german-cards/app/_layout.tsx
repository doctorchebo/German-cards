import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthGate } from '@/src/components/auth-gate';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="drill"
            options={{
              title: "Drill",
              headerBackVisible: false,
              headerLeft: () => (
                <Pressable onPress={() => router.back()} hitSlop={10}>
                  <MaterialIcons name="arrow-back-ios-new" size={22} color="#0f172a" />
                </Pressable>
              ),
            }}
          />
          <Stack.Screen
            name="mcq-drill"
            options={{
              title: "Special Practice",
              headerBackVisible: false,
              headerLeft: () => (
                <Pressable onPress={() => router.back()} hitSlop={10}>
                  <MaterialIcons name="arrow-back-ios-new" size={22} color="#0f172a" />
                </Pressable>
              ),
            }}
          />
          <Stack.Screen name="results" options={{ title: 'Results', headerBackVisible: false }} />
        </Stack>
        <AuthGate />
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
});
