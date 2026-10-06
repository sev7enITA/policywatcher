import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from '@/state/AppState';
import { CitizenStateProvider } from '@/state/CitizenState';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <CitizenStateProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper }, animation: 'fade_from_bottom' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="change/[id]" />
        </Stack>
        </CitizenStateProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
