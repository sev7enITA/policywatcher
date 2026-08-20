import { StyleSheet, Text, View } from 'react-native';
import type { Risk } from '@/domain/changeEvent';
import { useAppState } from '@/state/AppState';
import { colors, font } from '@/theme/tokens';

const tones = { High: colors.high, Medium: colors.medium, Low: colors.low } as const;

export function RiskBadge({ risk }: { risk: Risk }) {
  const { copy } = useAppState();
  return (
    <View style={[styles.badge, { borderColor: tones[risk] }]} accessibilityLabel={`Risk ${copy.risk[risk]}`}>
      <View style={[styles.marker, { backgroundColor: tones[risk] }]} />
      <Text style={[styles.text, { color: tones[risk] }]}>{copy.risk[risk].toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { minHeight: 28, borderWidth: 1, borderRadius: 3, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.paperBright },
  marker: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: font.mono, fontSize: 12, lineHeight: 15, fontWeight: '800', letterSpacing: 0.45 },
});
