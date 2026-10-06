import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { cs, useCitizenCopy } from './CitizenUI';
import { useAppState } from '@/state/AppState';

export function CitizenAudio({ text }: { text: string }) {
  const t = useCitizenCopy();
  const { locale } = useAppState();
  const [speaking, setSpeaking] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useFocusEffect(useCallback(() => () => { void Speech.stop(); setSpeaking(false); }, []));
  const speak = async () => {
    try {
      await Speech.stop();
      const voices = await Speech.getAvailableVoicesAsync();
      if (!voices.length) { setUnavailable(true); return; }
      setUnavailable(false); setSpeaking(true);
      Speech.speak(text.slice(0, 4000), { language: locale === 'it' ? 'it-IT' : 'en-GB', onDone: () => setSpeaking(false), onStopped: () => setSpeaking(false), onError: () => { setSpeaking(false); setUnavailable(true); } });
    } catch { setSpeaking(false); setUnavailable(true); }
  };
  return <View style={cs.actions}><ActionButton label={speaking ? t('Interrompi ascolto', 'Stop listening') : t('Ascolta la sintesi', 'Listen to summary')} icon={speaking ? 'stop' : 'volume-high'} onPress={() => { if (speaking) { void Speech.stop(); setSpeaking(false); } else void speak(); }} />{unavailable ? <Text accessibilityRole="alert" style={cs.small}>{t('Voce non disponibile sul dispositivo. La sintesi resta leggibile.', 'Speech unavailable on this device. The summary remains readable.')}</Text> : null}</View>;
}
