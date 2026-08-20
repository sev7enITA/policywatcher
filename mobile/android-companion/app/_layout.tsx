import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from '@/state/AppState';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper }, animation: 'fade_from_bottom' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="change/[id]" />
        </Stack>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
