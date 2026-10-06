import { useState } from 'react';
import { Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { CitizenStatus, cs, Field, useCitizenCopy } from '@/components/CitizenUI';
import { Masthead } from '@/components/Masthead';
import { PageIntro } from '@/components/PageIntro';
import { Screen } from '@/components/Screen';
import { useAppState } from '@/state/AppState';
import { useCitizenState } from '@/state/CitizenState';
import { CITIZEN_MAX_SERVICES } from '../../../../shared/citizen';

export default function ServicesScreen() {
  const t = useCitizenCopy();
  const { citizen, setCitizen } = useAppState();
  const { feed } = useCitizenState();
  const [query, setQuery] = useState('');
  const services = feed?.services.filter(service => service.name.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim())) ?? [];
  return <Screen><Masthead /><PageIntro eyebrow={t('SCELTE VOLONTARIE', 'VOLUNTARY CHOICES')} title={t('I miei servizi', 'My services')} body={t('Segui ciò che usi. Paese e piano restano sul dispositivo e non confermano quali clausole si applicano al tuo account.', 'Follow what you use. Country and plan stay on this device and do not confirm which clauses apply to your account.')} /><CitizenStatus />
    <View style={cs.section}>
      <Text style={cs.label}>{t('Paese di riferimento', 'Country context')}</Text>
      <View style={cs.row}>{[['all', t('Non specificato', 'Unspecified')], ['it', 'Italia'], ['de', 'Deutschland'], ['fr', 'France'], ['es', 'España'], ['gb', 'United Kingdom'], ['us', 'United States']].map(([code, name]) => <ActionButton key={code} label={`${citizen.country === code ? '✓ ' : ''}${name}`} onPress={() => setCitizen(value => ({ ...value, country: code! }))} />)}</View>
      <Text style={cs.small}>{t('Il paese aggiunge contesto. I documenti con ambito incerto restano visibili.', 'Country adds context. Documents with uncertain scope stay visible.')}</Text>
      <Text accessibilityRole="header" style={cs.title}>{t('Servizi seguiti', 'Followed services')} ({citizen.followed.length})</Text>
      {!citizen.followed.length ? <Text style={cs.body}>{t('Cerca qui sotto il primo servizio.', 'Find your first service below.')}</Text> : null}
      {citizen.followed.map(followed => <View key={followed.serviceId} style={cs.card}>
        <Text style={cs.subtitle}>{followed.name}</Text>
        {!feed?.services.some(service => service.id === followed.serviceId) ? <Text style={cs.warning}>{t('Servizio non disponibile nel catalogo attuale. La scelta è conservata.', 'Service unavailable in the current catalog. Your selection is retained.')}</Text> : null}
        <Field label={t('Piano o prodotto, facoltativo', 'Plan or product, optional')} value={followed.plan} maxLength={80} onChangeText={plan => setCitizen(value => ({ ...value, followed: value.followed.map(item => item.serviceId === followed.serviceId ? { ...item, plan } : item) }))} />
        <ActionButton label={t(`Smetti di seguire ${followed.name}`, `Unfollow ${followed.name}`)} onPress={() => setCitizen(value => ({ ...value, followed: value.followed.filter(item => item.serviceId !== followed.serviceId) }))} />
      </View>)}
      <Field label={t('Cerca nel catalogo pubblico', 'Search the public catalog')} value={query} onChangeText={setQuery} autoCapitalize="none" />
      {services.filter(service => !citizen.followed.some(item => item.serviceId === service.id)).map(service => <View key={service.id} style={cs.separator}><Text style={cs.subtitle}>{service.name}</Text><ActionButton label={t(`Segui ${service.name}`, `Follow ${service.name}`)} disabled={citizen.followed.length >= CITIZEN_MAX_SERVICES} onPress={() => setCitizen(value => ({ ...value, followed: [...value.followed, { serviceId: service.id, name: service.name, slug: service.slug, plan: '' }] }))} /></View>)}
      {!services.length ? <Text style={cs.small}>{t('Nessun risultato nel catalogo disponibile.', 'No results in the available catalog.')}</Text> : null}
      {citizen.followed.length >= CITIZEN_MAX_SERVICES ? <Text style={cs.warning}>{t(`Limite di ${CITIZEN_MAX_SERVICES} servizi raggiunto.`, `${CITIZEN_MAX_SERVICES}-service limit reached.`)}</Text> : null}
    </View></Screen>;
}
