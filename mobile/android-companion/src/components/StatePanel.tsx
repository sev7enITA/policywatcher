import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '@/theme/tokens';
import { ActionButton } from './ActionButton';

export function StatePanel({ tone = 'neutral', label, title, body, actionLabel, onAction }: {
  tone?: 'neutral' | 'warning' | 'evidence'; label?: string; title: string; body: string; actionLabel?: string; onAction?: () => void;
}) {
  const color = tone === 'warning' ? colors.rust : tone === 'evidence' ? colors.teal : colors.ink;
  const icon = tone === 'warning' ? 'alert-outline' : tone === 'evidence' ? 'shield-check-outline' : 'tag-search-outline';
  return (
    <View style={[styles.root, { borderLeftColor: color }]}>
      <View style={styles.topline}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
        {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? <View style={styles.action}><ActionButton label={actionLabel} onPress={onAction} tone="quiet" compact /></View> : null}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading evidence record">
      <View style={styles.skeletonRail} />
      <View style={styles.skeletonBody}>
        <View style={[styles.block, { width: '42%' }]} />
        <View style={[styles.block, { width: '84%', height: 21 }]} />
        <View style={[styles.block, { width: '64%', height: 21 }]} />
        <View style={[styles.block, { width: '100%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginHorizontal: 18, marginBottom: 14, backgroundColor: colors.paperBright, borderWidth: 1, borderColor: colors.rule, borderLeftWidth: 4, padding: 15 },
  topline: { flexDirection: 'row', gap: 7, alignItems: 'center', marginBottom: 6 },
  label: { fontFamily: font.mono, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  title: { color: colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '800' },
  body: { color: colors.body, fontSize: 15, lineHeight: 22, marginTop: 5 },
  action: { marginTop: 12, alignSelf: 'flex-start' },
  skeleton: { marginHorizontal: 18, minHeight: 190, flexDirection: 'row', backgroundColor: colors.paperBright, borderWidth: 1, borderColor: colors.rule, marginBottom: 12 },
  skeletonRail: { width: 42, backgroundColor: '#E7E4DC', borderRightWidth: 1, borderRightColor: colors.rule },
  skeletonBody: { flex: 1, padding: 16, gap: 13 },
  block: { height: 13, backgroundColor: '#E0E1DD' },
});
