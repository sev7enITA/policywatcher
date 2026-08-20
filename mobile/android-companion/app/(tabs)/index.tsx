import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Risk } from '@/domain/changeEvent';
import { EvidenceCard } from '@/components/EvidenceCard';
import { Explainer } from '@/components/Explainer';
import { Masthead } from '@/components/Masthead';
import { PageIntro } from '@/components/PageIntro';
import { Screen } from '@/components/Screen';
import { SkeletonCard, StatePanel } from '@/components/StatePanel';
import { useAppState } from '@/state/AppState';
import { colors, font } from '@/theme/tokens';

type RiskFilter = 'all' | Risk;

export default function TodayScreen() {
  const { copy, locale, feed, feedMode, refreshedAt, refreshing, lastError, newWatchedCount, refresh } = useAppState();
  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState<RiskFilter>('all');
  const events = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return (feed?.events ?? []).filter((event) => {
      const riskMatch = risk === 'all' || event.screening.overallRisk === risk;
      const searchMatch = !needle || [event.company.name, event.policy.name, event.policy.jurisdiction, event.screening.summary].some((value) => value.toLocaleLowerCase(locale).includes(needle));
      return riskMatch && searchMatch;
    });
  }, [feed, locale, query, risk]);
  const refreshed = refreshedAt
    ? new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(new Date(refreshedAt))
    : copy.today.never;

  const header = (
    <>
      <Masthead />
      <PageIntro eyebrow={copy.today.eyebrow} title={copy.today.title} body={copy.today.count(feed?.events.length ?? 0)} aside={`${copy.today.refreshed}\n${refreshed}`} />
      <Explainer />
      {newWatchedCount > 0 ? <StatePanel tone="evidence" label="WATCHLIST" title={copy.today.newWatched(newWatchedCount)} body={copy.watchlist.localOnly} /> : null}
      {feedMode === 'cached' ? <StatePanel tone="warning" label={copy.common.cached} title={copy.today.cachedTitle} body={copy.today.cachedBody} actionLabel={copy.today.retry} onAction={() => void refresh()} /> : null}
      {feedMode === 'demo' ? <StatePanel tone="warning" label={copy.common.demo} title={copy.today.demoTitle} body={copy.today.demoBody} actionLabel={copy.today.retry} onAction={() => void refresh()} /> : null}
      <View style={styles.tools}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={21} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={copy.today.search}
            placeholderTextColor={colors.muted}
            accessibilityLabel={copy.today.searchLabel}
            autoCapitalize="none"
            returnKeyType="search"
            style={styles.search}
          />
          {query ? <Pressable accessibilityRole="button" accessibilityLabel={copy.today.clearFilters} onPress={() => setQuery('')} style={styles.clear}><MaterialCommunityIcons name="close" size={20} color={colors.ink} /></Pressable> : null}
        </View>
        <View style={styles.filters} accessibilityRole="radiogroup">
          {(['all', 'High', 'Medium', 'Low'] as const).map((value) => {
            const active = risk === value;
            const label = value === 'all' ? copy.today.all : copy.risk[value];
            return <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setRisk(value)} style={({ pressed }) => [styles.filter, active && styles.filterActive, pressed && styles.pressed]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></Pressable>;
          })}
        </View>
      </View>
      {feedMode === 'loading' && !feed ? <><SkeletonCard /><SkeletonCard /></> : null}
    </>
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={feedMode === 'loading' && !feed ? [] : events}
        keyExtractor={(item) => item.eventId}
        renderItem={({ item, index }) => <EvidenceCard event={item} index={index} />}
        ListHeaderComponent={header}
        ListEmptyComponent={feedMode === 'loading' && !feed ? null : <StatePanel title={copy.today.empty} body={lastError ? copy.today.feedError : copy.today.clearFilters} actionLabel={(query || risk !== 'all') ? copy.today.clearFilters : copy.today.retry} onAction={() => { if (query || risk !== 'all') { setQuery(''); setRisk('all'); } else void refresh(); }} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} colors={[colors.teal, colors.indigo]} tintColor={colors.teal} progressBackgroundColor={colors.paperBright} />}
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 28 },
  tools: { paddingHorizontal: 18, marginBottom: 16 },
  searchBox: { minHeight: 52, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.paperBright, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  search: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 16, paddingVertical: 12 },
  clear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  filter: { minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.paperBright, borderRadius: 3 },
  filterActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { color: colors.ink, fontFamily: font.mono, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  pressed: { opacity: 0.65 },
});
