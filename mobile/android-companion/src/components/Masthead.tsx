import { Image, StyleSheet, Text, View } from 'react-native';
import { useAppState } from '@/state/AppState';
import { colors, font } from '@/theme/tokens';

export function Masthead() {
  const { copy, feedMode } = useAppState();
  const status = feedMode === 'live' ? copy.masthead.polling : feedMode === 'cached' ? copy.common.cached : feedMode === 'demo' ? copy.common.demo : copy.today.loading;
  return (
    <View style={styles.root} accessibilityRole="header">
      <View style={styles.identity}>
        <Image source={require('../../assets/policywatcher-logo-mark-512.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="PolicyWatcher" />
        <View style={styles.wordmark}>
          <Text style={styles.kicker}>{copy.masthead.kicker}</Text>
          <Text style={styles.product}>{copy.masthead.product}</Text>
        </View>
      </View>
      <View style={styles.statusRow}>
        <View style={styles.dot} />
        <Text style={styles.status}>{status}</Text>
        <View style={styles.rule} />
        <Text style={styles.limit}>{copy.masthead.notLive}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.ink, backgroundColor: colors.paper },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logo: { width: 36, height: 36 },
  wordmark: { flex: 1 },
  kicker: { fontFamily: font.mono, fontSize: 12, color: colors.teal, fontWeight: '700', letterSpacing: 0.45 },
  product: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginTop: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 11, minHeight: 18 },
  dot: { width: 7, height: 7, backgroundColor: colors.teal, borderRadius: 4, marginRight: 7 },
  status: { color: colors.body, fontFamily: font.mono, fontSize: 12 },
  rule: { width: 1, height: 13, backgroundColor: colors.ruleStrong, marginHorizontal: 9 },
  limit: { flexShrink: 1, color: colors.muted, fontFamily: font.mono, fontSize: 12 },
});
