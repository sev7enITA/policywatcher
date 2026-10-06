import { Linking, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { ActionButton } from './ActionButton';
import { useAppState } from '@/state/AppState';
import { useCitizenState } from '@/state/CitizenState';
import { colors } from '@/theme/tokens';
import { citizenSafeUrl } from '../../../../shared/citizen';

export function useCitizenCopy() {
  const { locale } = useAppState();
  return (it: string, en: string) => locale === 'it' ? it : en;
}
export function CitizenStatus() {
  const t = useCitizenCopy();
  const { mode, loading, error, cacheError, refresh } = useCitizenState();
  const { storageError } = useAppState();
  return <View style={cs.status}>
    <Text accessibilityLiveRegion="polite" style={cs.small}>{loading ? t('Aggiornamento in corso…', 'Checking for updates…') : mode === 'live' ? t('Elenco pubblico aggiornato. Verifica la data della singola fonte.', 'Public list refreshed. Check each source’s retrieval date.') : mode === 'cached' ? t('Copia sul dispositivo. Attualità e nuove modifiche da verificare.', 'Device copy. Freshness and new changes need checking.') : t('Dati pubblici non disponibili. Le tue scelte restano qui.', 'Public data unavailable. Your choices stay here.')}</Text>
    {error ? <Text accessibilityRole="alert" style={cs.warning}>{t('Aggiornamento non riuscito. Nessuna conclusione sul tuo account.', 'Refresh failed. No conclusion can be drawn about your account.')}</Text> : null}
    {storageError || cacheError ? <Text accessibilityRole="alert" style={cs.warning}>{t('Salvataggio locale non disponibile: le nuove modifiche potrebbero andare perse alla chiusura.', 'Local storage unavailable: new changes may be lost when you close the app.')}</Text> : null}
    <ActionButton label={t('Aggiorna dati pubblici', 'Refresh public data')} onPress={() => void refresh()} disabled={loading} icon="refresh" />
  </View>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={cs.field}><Text style={cs.label}>{label}</Text><TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.muted} style={[cs.input, props.multiline && cs.multiline, props.style]} /></View>;
}
export function ExternalAction({ label, url }: { label: string; url: string }) {
  const t = useCitizenCopy();
  const safe = citizenSafeUrl(url);
  return <ActionButton label={label} accessibilityLabel={`${label}. ${t('Apre un sito esterno', 'Opens an external website')}`} icon="open-in-new" disabled={!safe} onPress={() => { if (safe) void Linking.openURL(safe); }} />;
}
export function localDate(value: string | null | undefined, locale: string) {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-GB') : '-';
}
export const cs = StyleSheet.create({
  section: { marginHorizontal: 18, marginBottom: 22, gap: 12 },
  card: { borderTopWidth: 3, borderTopColor: colors.teal, backgroundColor: colors.paperBright, padding: 18, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.rule },
  status: { marginHorizontal: 18, marginBottom: 22, padding: 14, borderWidth: 1, borderColor: colors.ruleStrong, gap: 10 },
  title: { fontSize: 23, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  subtitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, color: colors.body, lineHeight: 24 },
  small: { fontSize: 14, color: colors.muted, lineHeight: 21 },
  warning: { fontSize: 14, color: colors.rust, lineHeight: 21 },
  kicker: { fontSize: 13, fontWeight: '800', color: colors.teal, letterSpacing: 0.5 },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '700', color: colors.ink },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.paperBright, color: colors.ink, fontSize: 16, padding: 12 },
  multiline: { minHeight: 145, textAlignVertical: 'top' },
  actions: { gap: 9 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  separator: { borderTopWidth: 1, borderTopColor: colors.rule, paddingTop: 14, gap: 10 },
  quote: { borderLeftWidth: 3, borderLeftColor: colors.ruleStrong, paddingLeft: 12, gap: 7 },
});
