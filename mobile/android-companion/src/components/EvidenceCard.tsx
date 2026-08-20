import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChangeEvent } from '@/domain/changeEvent';
import { useAppState } from '@/state/AppState';
import { colors, font } from '@/theme/tokens';
import { RiskBadge } from './RiskBadge';

export function EvidenceCard({ event, index, showWatch = true }: { event: ChangeEvent; index: number; showWatch?: boolean }) {
  const { copy, locale, watchlist, collection, toggleWatch, toggleSaved } = useAppState();
  const watching = watchlist.includes(event.company.id);
  const saved = collection.some((item) => item.changeId === event.changeId);
  const published = new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(event.occurredAt));

  return (
    <View style={styles.card}>
      <View style={styles.rail} accessible={false}>
        <Text style={styles.index}>{String(index + 1).padStart(2, '0')}</Text>
        <View style={styles.track}>
          <View style={styles.tick} />
          <View style={[styles.riskMark, { backgroundColor: event.screening.overallRisk === 'High' ? colors.high : event.screening.overallRisk === 'Medium' ? colors.medium : colors.low }]} />
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{copy.card.published} · {published.toUpperCase()}</Text>
          <RiskBadge risk={event.screening.overallRisk} />
        </View>
        <Text style={styles.company}>{event.company.name}</Text>
        <Text style={styles.title}>{event.policy.name}</Text>
        <Text style={styles.jurisdiction}>{event.policy.jurisdiction} · {event.policy.type} · {copy.card.score} {Math.round(event.screening.overallScore)}</Text>
        <Text style={styles.summary} numberOfLines={3}>{event.screening.summary}</Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${copy.card.open}: ${event.policy.name}`} onPress={() => router.push(`/change/${event.changeId}`)} style={({ pressed }) => [styles.open, pressed && styles.pressed]}>
            <Text style={styles.openText}>{copy.card.open}</Text><MaterialCommunityIcons name="arrow-right" size={18} color={colors.indigo} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={saved ? copy.card.saved : copy.card.save} onPress={() => toggleSaved(event)} style={({ pressed }) => [styles.iconAction, saved && styles.iconActionActive, pressed && styles.pressed]}>
            <MaterialCommunityIcons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? colors.indigo : colors.ink} />
          </Pressable>
          {showWatch ? <Pressable accessibilityRole="button" accessibilityLabel={watching ? copy.card.watching : copy.card.watch} onPress={() => toggleWatch(event.company.id)} style={({ pressed }) => [styles.iconAction, watching && styles.iconActionActive, pressed && styles.pressed]}>
            <MaterialCommunityIcons name={watching ? 'eye' : 'eye-outline'} size={20} color={watching ? colors.teal : colors.ink} />
          </Pressable> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 18, marginBottom: 13, backgroundColor: colors.paperBright, borderWidth: 1, borderColor: colors.ruleStrong, flexDirection: 'row' },
  rail: { width: 43, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.ruleStrong },
  index: { color: colors.ink, fontFamily: font.mono, fontSize: 13, fontWeight: '800', paddingTop: 14 },
  track: { flex: 1, width: 1, backgroundColor: colors.ruleStrong, marginTop: 12, marginBottom: 13, alignItems: 'center' },
  tick: { position: 'absolute', top: 14, width: 11, height: 2, backgroundColor: colors.teal },
  riskMark: { position: 'absolute', bottom: 17, width: 9, height: 9, transform: [{ rotate: '45deg' }] },
  body: { flex: 1, padding: 14, minWidth: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meta: { flex: 1, color: colors.muted, fontFamily: font.mono, fontSize: 12, lineHeight: 17 },
  company: { color: colors.teal, fontFamily: font.mono, fontSize: 12, fontWeight: '800', letterSpacing: 0.45, marginTop: 12, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '800', letterSpacing: -0.35, marginTop: 4 },
  jurisdiction: { color: colors.muted, fontFamily: font.mono, fontSize: 12, lineHeight: 18, marginTop: 7 },
  summary: { color: colors.body, fontSize: 15, lineHeight: 22, marginTop: 9 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13, paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.rule },
  open: { minHeight: 48, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  openText: { color: colors.indigo, fontSize: 14, fontWeight: '800' },
  iconAction: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.rule },
  iconActionActive: { backgroundColor: '#EDF0FF', borderColor: '#AAB3E4' },
  pressed: { opacity: 0.65 },
});
