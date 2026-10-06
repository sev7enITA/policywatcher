import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { CitizenStatus, cs, Field, ExternalAction, useCitizenCopy } from '@/components/CitizenUI';
import { Masthead } from '@/components/Masthead';
import { PageIntro } from '@/components/PageIntro';
import { Screen } from '@/components/Screen';
import { useCitizenState } from '@/state/CitizenState';
import { matchCitizenNotice, type CitizenService } from '../../../shared/citizen';

export default function NoticeScreen() {
  const t = useCitizenCopy();
  const { feed } = useCitizenState();
  const [input, setInput] = useState('');
  const [matches, setMatches] = useState<CitizenService[] | null>(null);
  const [error, setError] = useState(false);
  useFocusEffect(useCallback(() => () => { setInput(''); setMatches(null); }, []));
  const match = () => {
    try { setMatches(matchCitizenNotice(input, feed?.services ?? [])); setError(false); }
    catch { setError(true); setMatches(null); }
  };
  return <Screen><Masthead /><PageIntro eyebrow={t('SOLO SU QUESTO DISPOSITIVO', 'ONLY ON THIS DEVICE')} title={t('Spiegami questa comunicazione', 'Explain this notice')} body={t('Confrontiamo nomi e domini con il catalogo pubblico già scaricato. Il testo non viene inviato né salvato.', 'We match names and domains against the downloaded public catalog. Your text is neither sent nor saved.')} /><CitizenStatus /><View style={cs.section}>
    <Field label={t('Incolla un testo o un link, massimo 20 KiB', 'Paste text or a link, up to 20 KiB')} multiline value={input} onChangeText={value => { setInput(value); setMatches(null); }} maxLength={20480} autoCorrect={false} autoCapitalize="none" />
    <ActionButton tone="primary" label={t('Cerca riscontri sul dispositivo', 'Find matches on this device')} disabled={!input.trim() || !feed} onPress={match} />
    <ActionButton label={t('Cancella il testo', 'Clear text')} onPress={() => { setInput(''); setMatches(null); setError(false); }} />
    {error ? <Text accessibilityRole="alert" style={cs.warning}>{t('Il testo supera 20 KiB. Riducilo e riprova.', 'Text exceeds 20 KiB. Shorten it and retry.')}</Text> : null}
    {matches ? <Text style={cs.warning}>{t('Corrispondenze possibili. Non autenticano la comunicazione né provano che il contenuto sia corretto.', 'Possible matches. They do not authenticate the notice or establish that its content is correct.')}</Text> : null}
    {matches?.length === 0 ? <Text style={cs.body}>{t('Nessuna corrispondenza trovata. Non significa che la comunicazione sia falsa o irrilevante.', 'No match found. This does not mean the notice is false or irrelevant.')}</Text> : null}
    {matches?.map(service => <View key={service.id} style={cs.card}><Text style={cs.title}>{service.name}</Text>{service.policies.slice(0, 3).map(policy => <ExternalAction key={policy.id} label={policy.name} url={policy.sourceUrl} />)}{feed?.changes.filter(change => change.serviceId === service.id).map(change => <ActionButton key={change.id} label={t('Consulta la modifica pubblica', 'Read public change')} onPress={() => { setInput(''); router.push(`/citizen/${encodeURIComponent(change.id)}`); }} />)}</View>)}
    <ActionButton label={t('Torna al mio spazio', 'Back to my space')} onPress={() => router.navigate('/')} />
  </View></Screen>;
}
