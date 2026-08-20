import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { Masthead } from '@/components/Masthead';
import { PageIntro } from '@/components/PageIntro';
import { Screen } from '@/components/Screen';
import { POLICYWATCHER_ORIGIN } from '@/services/origin';
import { useAppState } from '@/state/AppState';
import { colors, font } from '@/theme/tokens';

export default function CompanionScreen() {
  const { copy, locale, setLocale, dismissExplainer } = useAppState();
  return (
    <Screen contentContainerStyle={styles.screenContent}>
      <Masthead />
      <PageIntro eyebrow={copy.companion.eyebrow} title={copy.companion.title} body={copy.companion.body} />
      <View style={styles.settingsSection}>
        <Text style={styles.sectionLabel}>{copy.companion.language}</Text>
        <View style={styles.languageRow} accessibilityRole="radiogroup">
          <LanguageChoice label={copy.companion.italian} value="it" selected={locale === 'it'} onPress={() => setLocale('it')} />
          <LanguageChoice label={copy.companion.english} value="en" selected={locale === 'en'} onPress={() => setLocale('en')} />
        </View>
      </View>
      <BoundaryBlock index="01" icon="database-lock-outline" title={copy.companion.dataTitle} body={copy.companion.dataBody} />
      <BoundaryBlock index="02" icon="refresh" title={copy.companion.pollingTitle} body={copy.companion.pollingBody} />
      <BoundaryBlock index="03" icon="scale-balance" title={copy.companion.boundaryTitle} body={copy.companion.boundaryBody} tone="warning" />
      <View style={styles.facts}>
        <View style={styles.fact}><Text style={styles.factLabel}>{copy.companion.origin}</Text><Text style={styles.factValue}>{POLICYWATCHER_ORIGIN}</Text></View>
        <View style={styles.fact}><Text style={styles.factLabel}>{copy.companion.storage}</Text><Text style={styles.factValue}>{copy.companion.storageValue}</Text></View>
      </View>
      <View style={styles.actions}>
        <ActionButton label={copy.companion.workspace} icon="open-in-new" tone="primary" onPress={() => void Linking.openURL(POLICYWATCHER_ORIGIN)} />
        <ActionButton label={copy.explainer.revisit} icon="information-outline" onPress={() => { dismissExplainer(false); router.navigate('/'); }} />
      </View>
    </Screen>
  );
}

function LanguageChoice({ label, value, selected, onPress }: { label: string; value: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [styles.language, selected && styles.languageActive, pressed && styles.pressed]}><Text style={[styles.languageCode, selected && styles.languageCodeActive]}>{value.toUpperCase()}</Text><Text style={[styles.languageLabel, selected && styles.languageLabelActive]}>{label}</Text>{selected ? <MaterialCommunityIcons name="check" size={19} color={colors.white} /> : null}</Pressable>;
}

function BoundaryBlock({ index, icon, title, body, tone }: { index: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; body: string; tone?: 'warning' }) {
  const accent = tone === 'warning' ? colors.rust : colors.teal;
  return <View style={styles.boundary}><View style={[styles.boundaryRail, { backgroundColor: accent }]}><Text style={styles.boundaryIndex}>{index}</Text></View><View style={styles.boundaryBody}><MaterialCommunityIcons name={icon} size={23} color={accent} /><Text style={styles.boundaryTitle}>{title}</Text><Text style={styles.boundaryCopy}>{body}</Text></View></View>;
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: 112 },
  settingsSection: { marginHorizontal: 18, marginBottom: 18, paddingTop: 13, borderTopWidth: 2, borderTopColor: colors.ink },
  sectionLabel: { color: colors.ink, fontFamily: font.mono, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  languageRow: { flexDirection: 'row', gap: 9, marginTop: 10 },
  language: { flex: 1, minHeight: 54, backgroundColor: colors.paperBright, borderWidth: 1, borderColor: colors.ruleStrong, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  languageActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  languageCode: { color: colors.teal, fontFamily: font.mono, fontSize: 12, fontWeight: '800' },
  languageCodeActive: { color: '#7FD2C8' },
  languageLabel: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '700' },
  languageLabelActive: { color: colors.white },
  boundary: { marginHorizontal: 18, marginBottom: 12, flexDirection: 'row', borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.paperBright },
  boundaryRail: { width: 43, alignItems: 'center', paddingTop: 14 },
  boundaryIndex: { color: colors.white, fontFamily: font.mono, fontWeight: '800', fontSize: 12 },
  boundaryBody: { flex: 1, padding: 15 },
  boundaryTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', marginTop: 9 },
  boundaryCopy: { color: colors.body, fontSize: 15, lineHeight: 22, marginTop: 6 },
  facts: { marginHorizontal: 18, marginTop: 6, borderTopWidth: 1, borderTopColor: colors.ink },
  fact: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.rule, gap: 4 },
  factLabel: { color: colors.muted, fontFamily: font.mono, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  factValue: { color: colors.ink, fontFamily: font.mono, fontSize: 13, lineHeight: 19 },
  actions: { marginHorizontal: 18, marginTop: 20, gap: 9 },
  pressed: { opacity: 0.65 },
});
