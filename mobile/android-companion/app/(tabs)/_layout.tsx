import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { useAppState } from '@/state/AppState';
import { colors } from '@/theme/tokens';

export default function TabLayout() {
  const { copy } = useAppState();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.indigo,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { height: 72, paddingTop: 7, paddingBottom: 8, backgroundColor: colors.paperBright, borderTopColor: colors.ruleStrong, borderTopWidth: 1 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      tabBarItemStyle: { minHeight: 56 },
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{ title: copy.tabs.today, tabBarAccessibilityLabel: copy.tabs.today, tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="newspaper-variant-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="watchlist" options={{ title: copy.tabs.watchlist, tabBarAccessibilityLabel: copy.tabs.watchlist, tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="eye-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="collection" options={{ title: copy.tabs.collection, tabBarAccessibilityLabel: copy.tabs.collection, tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bookmark-multiple-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="companion" options={{ title: copy.tabs.companion, tabBarAccessibilityLabel: copy.tabs.companion, tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cellphone-link" color={color} size={size} /> }} />
    </Tabs>
  );
}
