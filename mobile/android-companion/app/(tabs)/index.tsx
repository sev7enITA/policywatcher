import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { CitizenStatus, cs, localDate, useCitizenCopy } from '@/components/CitizenUI';
import { Masthead } from '@/components/Masthead';
import { PageIntro } from '@/components/PageIntro';
import { Screen } from '@/components/Screen';
import { useAppState } from '@/state/AppState';
import { useCitizenState } from '@/state/CitizenState';
import { citizenFreshness } from '../../../../shared/citizen';

export default function CitizenHome() {
  const t = useCitizenCopy();
  const { citizen, locale } = useAppState();
  const { feed, loading, loadMore } = useCitizenState();
  const changes = feed?.changes.filter(change => citizen.followed.some(service => service.serviceId === change.serviceId)) ?? [];
  return <Screen>
    <Masthead />
    <PageIntro eyebrow={t('IL TUO SPAZIO', 'YOUR SPACE')} title={t('Cosa cambia per me', 'What changes for me')} body={t('Segui i servizi che usi. Leggi le modifiche, controlla le fonti e scegli come procedere.', 'Follow the services you use. Read changes, check sources and choose your next step.')} />
    <CitizenStatus />
    <View style={cs.section}>
      <ActionButton tone="primary" label={t('Scegli i miei servizi', 'Choose my services')} icon="plus" onPress={() => router.navigate('/watchlist')} />
      <ActionButton label={t('Spiegami una comunicazione', 'Explain a notice')} icon="text-search" onPress={() => router.push('/notice')} />
    </View>
    {!citizen.followed.length ? <View style={cs.section}><Text style={cs.title}>{t('Partiamo dai tuoi servizi', 'Start with your services')}</Text><Text style={cs.body}>{t('La scelta è volontaria e resta sul dispositivo. Non chiediamo accesso ai tuoi account.', 'Your selection is voluntary and stays on this device. We do not request account access.')}</Text></View> : !changes.length ? <View style={cs.section}><Text style={cs.subtitle}>{t('Nessuna modifica in questa finestra', 'No changes in this window')}</Text><Text style={cs.body}>{t('Non significa che non ci siano cambiamenti. Prova lo storico o verifica la fonte ufficiale.', 'This does not mean nothing changed. Try earlier records or check the official source.')}</Text></View> : null}
    <View style={cs.section}>{changes.map(change => {
      const service = feed?.services.find(item => item.id === change.serviceId);
      const policy = service?.policies.find(item => item.id === change.policyId);
      const dated = citizenFreshness(policy?.lastRetrievedAt ?? null) !== 'recent';
      return <View key={change.id} style={cs.card}>
        <Text style={cs.kicker}>{service?.name ?? t('Servizio non disponibile', 'Service unavailable')}</Text>
        <Text accessibilityRole="header" style={cs.title}>{policy?.name ?? t('Documento pubblico', 'Public document')}</Text>
        <Text style={cs.small}>{t('Pubblicato', 'Published')} {localDate(change.publishedAt, locale)} · {t('Fonte acquisita', 'Source retrieved')} {localDate(policy?.lastRetrievedAt, locale)}</Text>
        {dated ? <Text style={cs.warning}>{t('Fonte datata o non disponibile: attualità da verificare.', 'Source dated or unavailable: freshness needs checking.')}</Text> : null}
        <Text style={cs.body}>{change.summary[locale]}</Text>
        <Text style={cs.small}>{t('Sintesi automatica. Impatto sul tuo account da valutare.', 'Automatic summary. Impact on your account remains to be assessed.')}</Text>
        <ActionButton label={t('Capisci e scegli', 'Understand and choose')} onPress={() => router.push(`/citizen/${encodeURIComponent(change.id)}`)} />
      </View>;
    })}</View>
    <View style={cs.section}>
      <Text style={cs.small}>{t('Lo storico mostra una finestra limitata di record pubblici. La data dell’elenco non è la data di acquisizione delle fonti.', 'History shows a limited window of public records. The list date is not the sources’ retrieval date.')}</Text>
      {feed?.history.hasMore ? <ActionButton label={t('Carica modifiche precedenti', 'Load earlier changes')} disabled={loading} onPress={() => void loadMore()} /> : null}
      {feed?.catalogTruncated ? <Text style={cs.warning}>{t('Catalogo parziale: alcuni servizi potrebbero mancare.', 'Partial catalog: some services may be missing.')}</Text> : null}
    </View>
  </Screen>;
}
