import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { Masthead } from '@/components/Masthead';
import { PageIntro } from '@/components/PageIntro';
import { Screen } from '@/components/Screen';
import { StatePanel } from '@/components/StatePanel';
import { buildCollectionUrl, parseCollectionParam, type ReviewStatus } from '@/domain/collection';
import { POLICYWATCHER_ORIGIN } from '@/services/origin';
import { useAppState } from '@/state/AppState';
import { colors, font } from '@/theme/tokens';

const nextStatus: Record<ReviewStatus, ReviewStatus> = { unreviewed: 'reviewing', reviewing: 'reviewed', reviewed: 'unreviewed' };

export default function CollectionScreen() {
  const params = useLocalSearchParams<{ changes?: string | string[] }>();
  const { copy, collection, removeSaved, setReviewStatus, importCollection, findEvent } = useAppState();
  const [linkNotice, setLinkNotice] = useState<'invalid' | number | null>(null);
  const handled = useRef<string | null>(null);
  const reviewed = collection.filter((item) => item.status === 'reviewed').length;
  const handoffUrl = buildCollectionUrl(POLICYWATCHER_ORIGIN, collection);

  useEffect(() => {
    if (!params.changes) return;
    const raw = Array.isArray(params.changes) ? params.changes.join('|') : params.changes;
    if (handled.current === raw) return;
    handled.current = raw;
    const ids = parseCollectionParam(params.changes);
    setLinkNotice(ids ? importCollection(ids) : 'invalid');
  }, [importCollection, params.changes]);

  const share = () => void Share.share({ message: handoffUrl, url: handoffUrl });
  return (
    <Screen>
      <Masthead />
      <PageIntro eyebrow={copy.collection.eyebrow} title={copy.collection.title} body={copy.collection.body} aside={copy.collection.selected(collection.length)} />
      <ProgressRibbon selected={collection.length} reviewed={reviewed} />
      {linkNotice === 'invalid' ? <StatePanel tone="warning" title={copy.collection.invalidLink} body={copy.companion.dataBody} /> : typeof linkNotice === 'number' && linkNotice > 0 ? <StatePanel tone="evidence" title={copy.collection.imported(linkNotice)} body={copy.collection.body} /> : null}
      {collection.length >= 12 ? <StatePanel tone="warning" title={copy.collection.limit} body={copy.collection.body} /> : null}
      {collection.length === 0 ? <StatePanel title={copy.collection.emptyTitle} body={copy.collection.emptyBody} actionLabel={copy.collection.browse} onAction={() => router.navigate('/')} /> : collection.map((item, index) => {
        const event = findEvent(item.changeId);
        return (
          <View key={item.changeId} style={styles.record}>
            <View style={styles.rail}>
              <Text style={styles.index}>{String(index + 1).padStart(2, '0')}</Text>
              <View style={styles.line} />
              <View style={[styles.statusMark, item.status === 'reviewed' && styles.statusDone]} />
            </View>
            <View style={styles.recordBody}>
              <Text style={styles.company}>{item.companyName}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.id}>{item.changeId}</Text>
              <View style={styles.rowActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${copy.review.next}: ${copy.review[item.status]}`}
                  onPress={() => setReviewStatus(item.changeId, nextStatus[item.status])}
                  style={({ pressed }) => [styles.reviewButton, item.status === 'reviewed' && styles.reviewDone, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name={item.status === 'reviewed' ? 'check-circle' : item.status === 'reviewing' ? 'progress-clock' : 'circle-outline'} size={19} color={item.status === 'reviewed' ? colors.teal : colors.ink} />
                  <Text style={[styles.reviewText, item.status === 'reviewed' && styles.reviewTextDone]}>{copy.review[item.status]}</Text>
                </Pressable>
                {event ? <Pressable accessibilityRole="link" onPress={() => router.push(`/change/${item.changeId}`)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><MaterialCommunityIcons name="arrow-right" size={20} color={colors.indigo} /></Pressable> : null}
                <Pressable accessibilityRole="button" accessibilityLabel={`${copy.collection.remove}: ${item.title}`} onPress={() => removeSaved(item.changeId)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><MaterialCommunityIcons name="delete-outline" size={20} color={colors.rust} /></Pressable>
              </View>
            </View>
          </View>
        );
      })}
      {collection.length > 0 ? (
        <View style={styles.handoff}>
          <Text style={styles.handoffLabel}>ID-ONLY HTTPS HANDOFF</Text>
          <Text style={styles.handoffUrl} numberOfLines={2}>{handoffUrl}</Text>
          <Text style={styles.handoffNote}>{copy.companion.dataBody}</Text>
          <View style={styles.handoffButtons}>
            <View style={styles.flex}><ActionButton label={copy.collection.openWeb} icon="open-in-new" tone="primary" onPress={() => void Linking.openURL(handoffUrl)} /></View>
            <View style={styles.flex}><ActionButton label={copy.collection.share} icon="share-variant-outline" onPress={share} /></View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function ProgressRibbon({ selected, reviewed }: { selected: number; reviewed: number }) {
  const { copy } = useAppState();
  const steps = [
    { number: '01', label: copy.collection.select, value: copy.collection.selected(selected), active: selected > 0 },
    { number: '02', label: copy.collection.review, value: copy.collection.reviewed(reviewed), active: reviewed > 0 },
    { number: '03', label: copy.collection.handoff, value: selected > 0 ? copy.common.web : '—', active: selected > 0 },
  ];
  return <View style={styles.ribbon}>{steps.map((step) => <View key={step.number} style={[styles.step, step.active && styles.stepActive]}><Text style={[styles.stepNumber, step.active && styles.stepNumberActive]}>{step.number}</Text><Text style={styles.stepLabel}>{step.label}</Text><Text numberOfLines={1} style={styles.stepValue}>{step.value}</Text></View>)}</View>;
}

const styles = StyleSheet.create({
  ribbon: { marginHorizontal: 18, marginBottom: 18, flexDirection: 'row', borderWidth: 1, borderColor: colors.ruleStrong },
  step: { flex: 1, minHeight: 78, padding: 9, backgroundColor: colors.paperBright, borderRightWidth: 1, borderRightColor: colors.rule },
  stepActive: { borderTopWidth: 3, borderTopColor: colors.teal, paddingTop: 6 },
  stepNumber: { color: colors.ruleStrong, fontFamily: font.mono, fontSize: 12, fontWeight: '800' },
  stepNumberActive: { color: colors.teal },
  stepLabel: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 5 },
  stepValue: { color: colors.muted, fontFamily: font.mono, fontSize: 12, marginTop: 4 },
  record: { marginHorizontal: 18, marginBottom: 12, backgroundColor: colors.paperBright, borderWidth: 1, borderColor: colors.ruleStrong, flexDirection: 'row' },
  rail: { width: 43, borderRightWidth: 1, borderRightColor: colors.ruleStrong, alignItems: 'center' },
  index: { color: colors.ink, fontFamily: font.mono, fontSize: 13, fontWeight: '800', marginTop: 13 },
  line: { flex: 1, width: 1, backgroundColor: colors.ruleStrong, marginVertical: 9 },
  statusMark: { width: 9, height: 9, borderWidth: 2, borderColor: colors.medium, marginBottom: 14, transform: [{ rotate: '45deg' }] },
  statusDone: { backgroundColor: colors.teal, borderColor: colors.teal },
  recordBody: { flex: 1, padding: 14, minWidth: 0 },
  company: { color: colors.teal, fontFamily: font.mono, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '800', marginTop: 4 },
  id: { color: colors.muted, fontFamily: font.mono, fontSize: 12, lineHeight: 18, marginTop: 7 },
  rowActions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.rule },
  reviewButton: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.ruleStrong, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  reviewDone: { borderColor: '#86B8AA', backgroundColor: '#E8F2EE' },
  reviewText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  reviewTextDone: { color: colors.teal },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.rule },
  handoff: { marginHorizontal: 18, marginTop: 10, padding: 16, backgroundColor: colors.ink, borderTopWidth: 4, borderTopColor: colors.teal },
  handoffLabel: { color: '#7FD2C8', fontFamily: font.mono, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  handoffUrl: { color: colors.white, fontFamily: font.mono, fontSize: 12, lineHeight: 18, marginTop: 9 },
  handoffNote: { color: '#C9D4E2', fontSize: 14, lineHeight: 20, marginTop: 10 },
  handoffButtons: { flexDirection: 'row', gap: 9, marginTop: 15 },
  flex: { flex: 1 },
  pressed: { opacity: 0.63 },
});
