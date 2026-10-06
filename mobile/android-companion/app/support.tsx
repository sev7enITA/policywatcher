import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { cs, Field, ExternalAction, useCitizenCopy } from '@/components/CitizenUI';
import { Masthead } from '@/components/Masthead';
import { PageIntro } from '@/components/PageIntro';
import { Screen } from '@/components/Screen';
import { useAppState } from '@/state/AppState';
import { useCitizenState } from '@/state/CitizenState';
import { exportLocalText } from '@/services/localExport';
import { POLICYWATCHER_ORIGIN } from '@/services/origin';
import { buildCitizenDossier } from '../../../shared/citizen';

export default function SupportScreen() {
  const t = useCitizenCopy();
  const params = useLocalSearchParams<{ change?: string; choice?: string }>();
  const { locale, citizen } = useAppState();
  const { feed } = useCitizenState();
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);
  const [working, setWorking] = useState(false);
  const choice = citizen.choices.find(item => item.id === params.choice || item.changeId === params.change);
  const change = feed?.changes.find(item => item.id === (params.change ?? choice?.changeId));
  const service = feed?.services.find(item => item.id === (change?.serviceId ?? choice?.serviceId));
  const policy = service?.policies.find(item => item.id === (change?.policyId ?? choice?.policyId));
  const draft = useMemo(() => choice || (change && service) ? buildCitizenDossier({ locale, choice, change, service, policy, note }) : null, [locale, choice, change, service, policy, note]);
  useFocusEffect(useCallback(() => () => setNote(''), []));
  const save = async () => {
    if (!draft) return;
    setWorking(true); setError(false);
    try { await exportLocalText(draft); } catch { setError(true); } finally { setWorking(false); }
  };
  return <Screen><Masthead /><PageIntro eyebrow={t('BOZZA DA CONTROLLARE', 'DRAFT TO REVIEW')} title={t('Chiedi supporto', 'Ask for support')} body={t('Prepara una bozza con le evidenze pubbliche e la tua domanda. Controllala prima di scegliere un destinatario.', 'Prepare a draft with public evidence and your question. Review it before choosing a recipient.')} /><View style={cs.section}>
    {draft ? <><Field label={t('La mia domanda, facoltativa', 'My question, optional')} multiline maxLength={2000} value={note} onChangeText={setNote} /><Text style={cs.small}>{t('Questa domanda viene aggiunta solo al file che scegli di esportare. Non inserire credenziali.', 'This question is included only in the file you choose to export. Do not include credentials.')}</Text><Text accessibilityRole="header" style={cs.title}>{t('Anteprima', 'Preview')}</Text><Text selectable style={[cs.body, cs.card]}>{draft}</Text><ActionButton tone="primary" disabled={working} label={Platform.OS === 'web' ? t('Scarica la bozza .txt', 'Download .txt draft') : t('Esporta o condividi la bozza .txt', 'Export or share .txt draft')} onPress={() => void save()} /><Text style={cs.small}>{t('Nessun invio automatico. La condivisione si apre soltanto quando la richiedi.', 'Nothing is sent automatically. Sharing opens only when you request it.')}</Text></> : <Text style={cs.body}>{t('Apri questa pagina da una modifica o da una scelta per includere i riferimenti corretti.', 'Open this page from a change or a choice to include the correct references.')}</Text>}
    {error ? <Text accessibilityRole="alert" style={cs.warning}>{t('Esportazione non disponibile. Puoi selezionare e copiare l’anteprima.', 'Export unavailable. You can select and copy the preview.')}</Text> : null}
    <ExternalAction label={t('Consulta l’elenco delle associazioni', 'Browse the organization directory')} url={`${POLICYWATCHER_ORIGIN}${locale === 'it' ? '/it/associazioni' : '/en/associations'}`} />
    <Text style={cs.small}>{t('Verifica ambito, contatti e disponibilità dell’organizzazione. L’elenco non implica una collaborazione con PolicyWatcher.', 'Check the organization’s scope, contacts and availability. Listing does not imply a partnership with PolicyWatcher.')}</Text>
    <ActionButton label={t('Torna alle mie scelte', 'Back to my choices')} onPress={() => router.navigate('/choices')} />
  </View></Screen>;
}
