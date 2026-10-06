import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { CitizenStatus, cs, ExternalAction, localDate, useCitizenCopy } from '@/components/CitizenUI';
import { Masthead } from '@/components/Masthead';
import { PageIntro } from '@/components/PageIntro';
import { Screen } from '@/components/Screen';
import { useAppState } from '@/state/AppState';
import { useCitizenState } from '@/state/CitizenState';
import { exportLocalText } from '@/services/localExport';
import { readRawPreferences } from '@/services/storage';
import { POLICYWATCHER_ORIGIN } from '@/services/origin';
import { emptyCitizenPreferences, evaluateCitizenChoice } from '../../../../shared/citizen';

export default function ChoicesScreen() {
  const t = useCitizenCopy();
  const { citizen, setCitizen, locale, storageError, recoverStorage } = useAppState();
  const { feed, mode } = useCitizenState();
  const [confirmClear, setConfirmClear] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [confirmRecovery, setConfirmRecovery] = useState(false);
  return <Screen><Masthead /><PageIntro eyebrow={t('LA TUA MEMORIA LOCALE', 'YOUR LOCAL RECORD')} title={t('Le mie scelte', 'My choices')} body={t('Sono tue dichiarazioni, conservate sul dispositivo. Una modifica successiva può richiedere una nuova lettura.', 'These are your statements, stored on this device. A later change may require another review.')} /><CitizenStatus /><View style={cs.section}>
    {storageError ? <View style={cs.card}><Text style={cs.title}>{t('Recupera il salvataggio locale', 'Recover local storage')}</Text><Text style={cs.body}>{t('Il salvataggio originale resta intatto quando non è leggibile. Puoi esportarlo prima di ripartire. Se il dispositivo blocca la memoria, verifica anche le sue impostazioni.', 'The original stored data is preserved when unreadable. You can export it before resetting. If the device blocks storage, also check its settings.')}</Text><ActionButton label={t('Esporta il salvataggio originale', 'Export original stored data')} onPress={() => { setExportError(false); void readRawPreferences().then(raw => exportLocalText(raw ?? '', 'policywatcher-storage-backup.txt')).catch(() => setExportError(true)); }} /><ActionButton tone="danger" label={t('Ripristina le preferenze locali', 'Reset local preferences')} onPress={() => setConfirmRecovery(true)} />{confirmRecovery ? <><Text style={cs.warning}>{t('Questo ripristino elimina servizi, scelte e raccolta locale, inclusi i dati non leggibili. Esporta prima una copia se vuoi conservarli.', 'This reset deletes services, choices and the local evidence collection, including unreadable data. Export a copy first if you want to keep them.')}</Text><ActionButton tone="danger" label={t('Conferma ripristino completo', 'Confirm full reset')} onPress={() => void recoverStorage().then(ok => { if (ok) setConfirmRecovery(false); })} /><ActionButton label={t('Annulla ripristino', 'Cancel reset')} onPress={() => setConfirmRecovery(false)} /></> : null}</View> : null}
    {!citizen.choices.length ? <Text style={cs.body}>{t('Non hai ancora registrato una scelta. Apri una modifica per iniziare.', 'You have not recorded a choice yet. Open a change to begin.')}</Text> : null}
    {citizen.choices.map(choice => {
      const state = evaluateCitizenChoice(choice, feed, mode === 'live');
      const latest = feed?.services.find(service => service.id === choice.serviceId)?.policies.find(policy => policy.id === choice.policyId)?.latestChange;
      return <View key={choice.id} style={cs.card}><Text style={cs.kicker}>{choice.serviceName}</Text><Text style={cs.subtitle}>{choice.policyName}</Text><Text style={state === 'recorded' ? cs.body : cs.warning}>{state === 'revisit' ? t('Da rivedere', 'Review again') : state === 'unknown' ? t('Attualità da verificare', 'Freshness needs checking') : t('Scelta registrata', 'Choice recorded')}</Text><Text style={cs.body}>{({ reviewed: t('Hai dichiarato di aver letto la modifica.', 'You reported reviewing the change.'), action_recorded: t('Hai dichiarato di aver seguito una guida.', 'You reported following a guide.'), remind_me: t('Hai scelto di tornarci alla prossima visita.', 'You chose to revisit next time.') })[choice.status]}</Text><Text style={cs.small}>{localDate(choice.recordedAt, locale)} · {t('Effetto sul servizio non verificato.', 'Effect on the service unverified.')}</Text>
        <ActionButton label={t('Apri la modifica di riferimento', 'Open baseline change')} onPress={() => router.push(`/citizen/${encodeURIComponent(choice.changeId)}`)} />
        {state === 'revisit' && latest && latest.id !== choice.changeId ? <>{feed?.changes.some(change => change.id === latest.id) ? <ActionButton label={t('Apri la modifica successiva', 'Open later change')} onPress={() => router.push(`/citizen/${encodeURIComponent(latest.id)}`)} /> : <ExternalAction label={t('Apri la modifica successiva sul sito', 'Open later change on website')} url={`${POLICYWATCHER_ORIGIN}/change/${encodeURIComponent(latest.id)}`} />}</> : null}
        <ActionButton label={t('Prepara una bozza di supporto', 'Prepare a support draft')} onPress={() => router.push(`/support?choice=${encodeURIComponent(choice.id)}`)} />
        <ActionButton label={t('Rimuovi questa scelta', 'Remove this choice')} onPress={() => setCitizen(value => ({ ...value, choices: value.choices.filter(item => item.id !== choice.id) }))} />
      </View>;
    })}
    <Text style={cs.title}>{t('Modifiche salvate', 'Saved changes')}</Text>
    {!citizen.savedChangeIds.length ? <Text style={cs.small}>{t('Nessuna modifica salvata.', 'No saved changes.')}</Text> : citizen.savedChangeIds.map(id => <View key={id} style={cs.separator}><Text style={cs.body}>{feed?.changes.find(change => change.id === id)?.summary[locale] ?? t('Record fuori dalla finestra attuale; il riferimento è conservato.', 'Record outside the current window; the reference is retained.')}</Text><ActionButton label={t('Apri il record', 'Open record')} onPress={() => router.push(`/citizen/${encodeURIComponent(id)}`)} /><ActionButton label={t('Rimuovi dai salvati', 'Remove from saved')} onPress={() => setCitizen(value => ({ ...value, savedChangeIds: value.savedChangeIds.filter(saved => saved !== id) }))} /></View>)}
    <View style={cs.separator}><ActionButton label={t('Esporta i miei dati locali', 'Export my local data')} onPress={() => { setExportError(false); void exportLocalText(JSON.stringify(citizen, null, 2), 'policywatcher-my-choices.json').catch(() => setExportError(true)); }} />{exportError ? <Text style={cs.warning}>{t('Esportazione non disponibile sul dispositivo.', 'Export unavailable on this device.')}</Text> : null}<ActionButton label={t('Cancella servizi e scelte locali', 'Clear local services and choices')} tone="danger" onPress={() => setConfirmClear(true)} />{confirmClear ? <><Text style={cs.body}>{t('Confermi la cancellazione dei dati di questo percorso? La raccolta di evidenze precedente viene conservata.', 'Clear this journey’s local data? Your previous evidence collection will be retained.')}</Text><ActionButton label={t('Conferma cancellazione locale', 'Confirm local deletion')} tone="danger" onPress={() => { setCitizen(() => emptyCitizenPreferences()); setConfirmClear(false); }} /><ActionButton label={t('Annulla', 'Cancel')} onPress={() => setConfirmClear(false)} /></> : null}</View>
  </View></Screen>;
}
