import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/ActionButton';
import { RiskBadge } from '@/components/RiskBadge';
import { Screen } from '@/components/Screen';
import { StatePanel } from '@/components/StatePanel';
import { UUID_V4_RE } from '@/domain/changeEvent';
import { useAppState } from '@/state/AppState';
import { colors, font } from '@/theme/tokens';

export default function ChangeDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { copy, locale, collection, toggleSaved, findEvent } = useAppState();
  const changeId = typeof id === 'string' && UUID_V4_RE.test(id) ? id.toLowerCase() : '';
  const event = findEvent(changeId);
  const saved = event ? collection.some((item) => item.changeId === event.changeId) : false;
  const insets = useSafeAreaInsets();
  if (!event) {
    return (
      <Screen>
        <View style={styles.nav}><BackButton /></View>
        <StatePanel tone="warning" label="INVALID / UNAVAILABLE" title={copy.detail.missingTitle} body={copy.detail.missingBody} />
      </Screen>
    );
  }
  const date = new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(event.occurredAt));
  const dock = (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 9) }]}>
      <View style={styles.dockInner}>
        <ActionButton label={saved ? copy.detail.remove : copy.detail.save} icon={saved ? 'bookmark-remove' : 'bookmark-plus-outline'} onPress={() => toggleSaved(event)} compact />
        <View style={styles.dockPrimary}><ActionButton label={copy.detail.openEvidence} icon="shield-check-outline" tone="primary" onPress={() => void Linking.openURL(event.links.evidence)} /></View>
        <ActionButton label={copy.detail.share} icon="share-variant-outline" onPress={() => void Share.share({ message: event.links.change, url: event.links.change })} compact />
      </View>
    </View>
  );
  return (
    <Screen footer={dock} contentContainerStyle={{ paddingBottom: 118 }}>
      <View style={styles.nav}><BackButton /><Text style={styles.navId}>{event.changeId.slice(0, 8)}…</Text></View>
      <View style={styles.hero}>
        <View style={styles.heroRail}><Text style={styles.heroRailNumber}>01</Text><View style={styles.heroRailLine} /><View style={styles.heroTick} /></View>
        <View style={styles.heroBody}>
          <Text style={styles.eyebrow}>{copy.detail.publication}</Text>
          <Text style={styles.company}>{event.company.name}</Text>
          <Text style={styles.title}>{event.policy.name}</Text>
          <RiskBadge risk={event.screening.overallRisk} />
        </View>
      </View>
      <View style={styles.metadata}>
        <Meta label={copy.detail.published} value={date} />
        <Meta label={copy.detail.jurisdiction} value={event.policy.jurisdiction} />
        <Meta label={copy.detail.policyType} value={event.policy.type} />
      </View>
      <ReadingSection number="02" title={copy.detail.screening} accent={colors.teal}>
        <View style={styles.scoreRow}><Text style={styles.score}>{Math.round(event.screening.overallScore)}</Text><Text style={styles.scoreLabel}>/ 100{`\n`}{copy.card.score}</Text></View>
        <Text style={styles.readingCopy}>{event.screening.summary}</Text>
      </ReadingSection>
      <ReadingSection number="03" title={copy.detail.boundary} accent={colors.rust}>
        <Text style={styles.boundaryCopy}>{event.screening.boundary}</Text>
      </ReadingSection>
      <ReadingSection number="04" title={copy.detail.provenance} accent={colors.indigo}>
        <Text style={styles.provenanceLabel}>{copy.detail.changeId}</Text>
        <Text selectable style={styles.uuid}>{event.changeId}</Text>
        <ProvenanceLink label={copy.detail.canonical} onPress={() => void Linking.openURL(event.links.change)} />
        <ProvenanceLink label={copy.detail.packet} onPress={() => void Linking.openURL(event.links.evidenceJson)} />
        <View style={styles.webAction}><ActionButton label={copy.detail.continueWeb} icon="open-in-new" onPress={() => void Linking.openURL(event.links.change)} /></View>
      </ReadingSection>
    </Screen>
  );
}

function BackButton() {
  const { copy } = useAppState();
  return <Pressable accessibilityRole="button" accessibilityLabel={copy.detail.back} onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialCommunityIcons name="arrow-left" size={22} color={colors.ink} /><Text style={styles.backText}>{copy.detail.back}</Text></Pressable>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <View style={styles.metaItem}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue}>{value}</Text></View>;
}

function ReadingSection({ number, title, accent, children }: React.PropsWithChildren<{ number: string; title: string; accent: string }>) {
  return <View style={styles.section}><View style={[styles.sectionHeader, { borderTopColor: accent }]}><Text style={[styles.sectionNumber, { color: accent }]}>{number}</Text><Text style={styles.sectionTitle}>{title}</Text></View><View style={styles.sectionBody}>{children}</View></View>;
}

function ProvenanceLink({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.provenanceLink, pressed && styles.pressed]}><Text style={styles.provenanceLinkText}>{label}</Text><MaterialCommunityIcons name="open-in-new" size={18} color={colors.indigo} /></Pressable>;
}

const styles = StyleSheet.create({
  nav: { minHeight: 58, borderBottomWidth: 1, borderBottomColor: colors.ruleStrong, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { minHeight: 48, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 7 },
  backText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  navId: { color: colors.muted, fontFamily: font.mono, fontSize: 12 },
  hero: { flexDirection: 'row', marginHorizontal: 18, marginTop: 20, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.paperBright },
  heroRail: { width: 48, alignItems: 'center', backgroundColor: colors.ink },
  heroRailNumber: { color: colors.white, fontFamily: font.mono, fontSize: 13, fontWeight: '800', marginTop: 16 },
  heroRailLine: { width: 1, backgroundColor: '#66768D', flex: 1, marginVertical: 12 },
  heroTick: { width: 11, height: 11, backgroundColor: colors.teal, transform: [{ rotate: '45deg' }], marginBottom: 18 },
  heroBody: { flex: 1, padding: 17, minWidth: 0 },
  eyebrow: { color: colors.teal, fontFamily: font.mono, fontSize: 12, fontWeight: '800', letterSpacing: 0.55 },
  company: { color: colors.body, fontSize: 16, fontWeight: '700', marginTop: 13 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 32, letterSpacing: -0.7, fontWeight: '800', marginTop: 4, marginBottom: 14 },
  metadata: { marginHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.ruleStrong, paddingVertical: 8 },
  metaItem: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
  metaLabel: { width: 108, color: colors.muted, fontFamily: font.mono, fontSize: 12, textTransform: 'uppercase' },
  metaValue: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '600' },
  section: { marginHorizontal: 18, marginTop: 23 },
  sectionHeader: { borderTopWidth: 3, paddingTop: 9, flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  sectionNumber: { fontFamily: font.mono, fontSize: 12, fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  sectionBody: { paddingLeft: 28, paddingTop: 11 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  score: { color: colors.ink, fontFamily: font.mono, fontSize: 38, lineHeight: 43, fontWeight: '800' },
  scoreLabel: { color: colors.muted, fontFamily: font.mono, fontSize: 12, lineHeight: 16, marginLeft: 6, marginBottom: 4 },
  readingCopy: { color: colors.body, fontSize: 17, lineHeight: 26 },
  boundaryCopy: { color: colors.rust, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  provenanceLabel: { color: colors.muted, fontFamily: font.mono, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  uuid: { color: colors.ink, fontFamily: font.mono, fontSize: 13, lineHeight: 20, marginTop: 5, marginBottom: 10 },
  provenanceLink: { minHeight: 48, borderTopWidth: 1, borderTopColor: colors.rule, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  provenanceLinkText: { flex: 1, color: colors.indigo, fontSize: 15, fontWeight: '700' },
  webAction: { marginTop: 12 },
  dock: { backgroundColor: colors.paperBright, borderTopWidth: 1, borderTopColor: colors.ink, paddingTop: 9, paddingHorizontal: 10 },
  dockInner: { width: '100%', maxWidth: 720, alignSelf: 'center', flexDirection: 'row', gap: 8 },
  dockPrimary: { flex: 1 },
  pressed: { opacity: 0.65 },
});
