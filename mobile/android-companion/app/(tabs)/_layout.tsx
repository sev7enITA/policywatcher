import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { useAppState } from '@/state/AppState';
import { colors } from '@/theme/tokens';

export default function TabLayout() {
  const { copy, locale } = useAppState();
  const t = (it: string, en: string) => locale === 'it' ? it : en;
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.indigo,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { minHeight: 72, paddingTop: 7, paddingBottom: 8, backgroundColor: colors.paperBright, borderTopColor: colors.ruleStrong, borderTopWidth: 1 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      tabBarItemStyle: { minHeight: 56 },
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{ title: t('Per te', 'For you'), tabBarAccessibilityLabel: t('Per te', 'For you'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="newspaper-variant-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="watchlist" options={{ title: t('Servizi', 'Services'), tabBarAccessibilityLabel: t('I miei servizi', 'My services'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="eye-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="choices" options={{ title: t('Scelte', 'Choices'), tabBarAccessibilityLabel: t('Le mie scelte', 'My choices'), tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bookmark-check-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="collection" options={{ href: null }} />
      <Tabs.Screen name="companion" options={{ title: copy.tabs.companion, tabBarAccessibilityLabel: copy.tabs.companion, tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cellphone-link" color={color} size={size} /> }} />
    </Tabs>
  );
}
