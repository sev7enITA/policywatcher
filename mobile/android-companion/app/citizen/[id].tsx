import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { CitizenAudio } from '@/components/CitizenAudio';
import { CitizenStatus, cs, ExternalAction, localDate, useCitizenCopy } from '@/components/CitizenUI';
import { Masthead } from '@/components/Masthead';
import { PageIntro } from '@/components/PageIntro';
import { Screen } from '@/components/Screen';
import { useAppState } from '@/state/AppState';
import { useCitizenState } from '@/state/CitizenState';
import { CITIZEN_MAX_CHOICES, CITIZEN_MAX_SAVED, citizenFreshness, type CitizenChoiceStatus } from '../../../../shared/citizen';
import { citizenGuideFreshness, citizenGuidesForService } from '../../../../shared/citizenGuides';
import { POLICYWATCHER_ORIGIN } from '@/services/origin';

export default function CitizenDetail() {
  const t = useCitizenCopy();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { citizen, setCitizen, locale } = useAppState();
  const { feed } = useCitizenState();
  const [notice, setNotice] = useState('');
  const change = feed?.changes.find(item => item.id === id);
  const service = feed?.services.find(item => item.id === change?.serviceId);
  const policy = service?.policies.find(item => item.id === change?.policyId);
  const guides = citizenGuidesForService(service?.slug ?? '');
  const record = (status: CitizenChoiceStatus, guideId?: string) => {
    if (!change || !service || !policy) return;
    const existing = citizen.choices.find(choice => choice.changeId === change.id);
    if (!existing && citizen.choices.length >= CITIZEN_MAX_CHOICES) { setNotice(t('Limite di scelte raggiunto. Rimuovi una scelta precedente.', 'Choice limit reached. Remove an older choice.')); return; }
    setCitizen(value => ({ ...value, choices: [{ id: existing?.id ?? `choice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, serviceId: service.id, serviceName: service.name, policyId: policy.id, policyName: policy.name, changeId: change.id, baselinePublishedAt: change.publishedAt, status, recordedAt: new Date().toISOString(), ...(guideId ? { guideId } : {}) }, ...value.choices.filter(choice => choice.changeId !== change.id)] }));
    setNotice(t('Scelta registrata sul dispositivo. Effetto sul servizio non verificato.', 'Choice recorded on this device. Effect on the service is unverified.'));
  };
  return <Screen><Masthead /><View style={[cs.section, { marginTop: 18 }]}><ActionButton label={t('Torna alle modifiche', 'Back to changes')} onPress={() => router.navigate('/')} /></View>
    {!change || !service || !policy ? <View style={cs.section}><Text style={cs.title}>{t('Record fuori dalla finestra disponibile', 'Record outside the available window')}</Text><Text style={cs.body}>{t('Aggiorna o carica lo storico. Le tue scelte non sono state cancellate.', 'Refresh or load earlier records. Your choices have not been deleted.')}</Text><ExternalAction label={t('Apri il record pubblico sul sito', 'Open the public record on the website')} url={`${POLICYWATCHER_ORIGIN}/change/${encodeURIComponent(id ?? '')}`} /></View> : <>
      <PageIntro eyebrow={service.name} title={policy.name} body={t('Comprendi la modifica e scegli il prossimo passo.', 'Understand the change and choose your next step.')} />
      <CitizenStatus />
      <View style={cs.section}><Text style={cs.body}>{change.summary[locale]}</Text><Text style={cs.small}>{t('Sintesi automatica da verificare. Applicabilità al tuo account e piano non confermata.', 'Automatic summary to review. Applicability to your account and plan is unconfirmed.')}</Text><Text style={cs.small}>{t('Pubblicato', 'Published')} {localDate(change.publishedAt, locale)} · {t('Acquisizione della fonte', 'Source retrieval')} {localDate(policy.lastRetrievedAt, locale)} · {policy.jurisdiction}</Text>
        <Text style={cs.small}>{({ substantive: t('Modifica sostanziale rilevata', 'Substantive change detected'), editorial: t('Modifica editoriale rilevata', 'Editorial change detected'), unchanged: t('Nessuna modifica sostanziale classificata', 'No substantive change classified'), needs_review: t('Classificazione da rivedere', 'Classification needs review') })[change.kind]}</Text>
        {citizenFreshness(policy.lastRetrievedAt) !== 'recent' ? <Text style={cs.warning}>{t('La fonte è datata o non disponibile. Verifica la versione attuale prima di decidere.', 'The source is dated or unavailable. Check the current version before deciding.')}</Text> : null}
        <CitizenAudio text={change.summary[locale]} />
        <ExternalAction label={t('Apri la fonte ufficiale', 'Open official source')} url={policy.sourceUrl} />
        <ExternalAction label={t('Consulta le evidenze', 'Read the evidence')} url={new URL(change.evidencePath, POLICYWATCHER_ORIGIN).toString()} />
        {change.evidence.map((evidence, index) => <View key={index} style={cs.quote}><Text style={cs.label}>{t('Prima', 'Before')}</Text><Text selectable style={cs.body}>{evidence.before}</Text><Text style={cs.label}>{t('Dopo', 'After')}</Text><Text selectable style={cs.body}>{evidence.after}</Text></View>)}
        <ActionButton label={citizen.savedChangeIds.includes(change.id) ? t('Rimuovi dai salvati', 'Remove from saved') : t('Salva questa modifica', 'Save this change')} disabled={!citizen.savedChangeIds.includes(change.id) && citizen.savedChangeIds.length >= CITIZEN_MAX_SAVED} onPress={() => setCitizen(value => ({ ...value, savedChangeIds: value.savedChangeIds.includes(change.id) ? value.savedChangeIds.filter(saved => saved !== change.id) : [...value.savedChangeIds, change.id] }))} />
      </View>
      <View style={cs.section}><Text accessibilityRole="header" style={cs.title}>{t('Cosa posso fare', 'What can I do')}</Text><Text style={cs.body}>{t('Queste guide descrivono opzioni del servizio. Non dimostrano che una specifica azione risolva la modifica rilevata.', 'These guides describe service options. They do not establish that a specific action resolves the detected change.')}</Text>
        {!guides.length ? <Text style={cs.body}>{t('Non abbiamo una guida verificata per questo servizio. Parti dalla fonte ufficiale o prepara una richiesta di supporto.', 'We have no reviewed guide for this service. Start with the official source or prepare a support request.')}</Text> : guides.map(guide => <View key={guide.id} style={cs.card}><Text style={cs.subtitle}>{guide.title[locale]}</Text><Text style={cs.body}>{guide.scope[locale]}</Text><Text style={cs.small}>{t('Guida consultata il', 'Guide reviewed on')} {localDate(guide.reviewedAt, locale)}</Text>{citizenGuideFreshness(guide) === 'review_due' ? <Text style={cs.warning}>{t('Guida da ricontrollare sul sito ufficiale.', 'Guide needs checking on the official website.')}</Text> : null}{guide.steps[locale].map((step, index) => <Text key={step} style={cs.body}>{index + 1}. {step}</Text>)}<Text style={cs.small}>{guide.boundary[locale]}</Text><ExternalAction label={t('Leggi la guida ufficiale', 'Read official guide')} url={guide.officialUrl} /><ActionButton label={t('Dichiaro di aver seguito questa guida', 'I report following this guide')} onPress={() => record('action_recorded', guide.id)} /></View>)}
        <Text style={cs.small}>{t('Registri una tua dichiarazione. PolicyWatcher non accede al servizio per verificarne l’effetto.', 'You record your own statement. PolicyWatcher does not access the service to verify its effect.')}</Text>
        <ActionButton label={t('Ho letto questa modifica', 'I have reviewed this change')} onPress={() => record('reviewed')} />
        <ActionButton label={t('Da rivedere alla prossima visita', 'Revisit next time')} onPress={() => record('remind_me')} />
        <Text style={cs.small}>{t('Il promemoria compare nelle tue scelte. Non invia notifiche push.', 'The reminder appears in your choices. It does not send push notifications.')}</Text>
        {notice ? <Text accessibilityLiveRegion="polite" style={cs.body}>{notice}</Text> : null}
        <ActionButton tone="primary" label={t('Prepara una richiesta di supporto', 'Prepare a support request')} onPress={() => router.push(`/support?change=${encodeURIComponent(change.id)}`)} />
      </View>
    </>}
  </Screen>;
}
