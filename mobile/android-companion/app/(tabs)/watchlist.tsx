import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { EvidenceCard } from '@/components/EvidenceCard';
import { Masthead } from '@/components/Masthead';
import { PageIntro } from '@/components/PageIntro';
import { Screen } from '@/components/Screen';
import { StatePanel } from '@/components/StatePanel';
import { useAppState } from '@/state/AppState';
import { colors, font } from '@/theme/tokens';

export default function WatchlistScreen() {
  const { copy, feed, watchlist, toggleWatch } = useAppState();
  const watched = useMemo(() => watchlist.flatMap((companyId) => {
    const records = feed?.events.filter((event) => event.company.id === companyId) ?? [];
    return records[0] ? [{ company: records[0].company, records }] : [];
  }), [feed, watchlist]);
  return (
    <Screen>
      <Masthead />
      <PageIntro eyebrow={copy.watchlist.eyebrow} title={copy.watchlist.title} body={copy.watchlist.body} aside={copy.watchlist.localOnly} />
      {watched.length === 0 ? <StatePanel title={copy.watchlist.emptyTitle} body={copy.watchlist.emptyBody} actionLabel={copy.watchlist.browse} onAction={() => router.navigate('/')} /> : watched.map(({ company, records }, index) => (
        <View key={company.id} style={styles.companySection}>
          <View style={styles.companyHead}>
            <View style={styles.companyIndex}><Text style={styles.companyIndexText}>{String(index + 1).padStart(2, '0')}</Text></View>
            <View style={styles.companyCopy}>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.companyMeta}>{company.industry} · {copy.watchlist.publications(records.length)}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`${copy.watchlist.remove} ${company.name}`} onPress={() => toggleWatch(company.id)} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}><Text style={styles.removeText}>{copy.watchlist.remove}</Text></Pressable>
          </View>
          <EvidenceCard event={records[0]!} index={index} showWatch={false} />
        </View>
      ))}
      {watched.length > 0 ? <View style={styles.bottomAction}><ActionButton label={copy.watchlist.browse} icon="newspaper-variant-outline" onPress={() => router.navigate('/')} /></View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  companySection: { marginBottom: 9 },
  companyHead: { marginHorizontal: 18, borderTopWidth: 2, borderTopColor: colors.ink, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  companyIndex: { width: 35, height: 35, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  companyIndexText: { color: colors.white, fontFamily: font.mono, fontSize: 12, fontWeight: '800' },
  companyCopy: { flex: 1 },
  companyName: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  companyMeta: { color: colors.muted, fontFamily: font.mono, fontSize: 12, marginTop: 2 },
  remove: { minWidth: 64, minHeight: 48, justifyContent: 'center', alignItems: 'flex-end' },
  removeText: { color: colors.rust, fontSize: 13, fontWeight: '700' },
  bottomAction: { marginHorizontal: 18, marginTop: 8 },
  pressed: { opacity: 0.6 },
});
