import { StyleSheet, Text, View } from 'react-native';
import { useAppState } from '@/state/AppState';
import { colors, font } from '@/theme/tokens';
import { ActionButton } from './ActionButton';

export function Explainer() {
  const { copy, explainerDismissed, dismissExplainer } = useAppState();
  if (explainerDismissed) return null;
  return (
    <View style={styles.root} accessibilityRole="summary">
      <View style={styles.number}><Text style={styles.numberText}>01</Text></View>
      <View style={styles.content}>
        <Text style={styles.label}>{copy.explainer.label}</Text>
        <Text style={styles.title}>{copy.explainer.title}</Text>
        <Text style={styles.body}>{copy.explainer.body}</Text>
        <View style={styles.action}><ActionButton label={copy.explainer.dismiss} icon="check" onPress={() => dismissExplainer(true)} tone="quiet" compact /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginHorizontal: 18, marginBottom: 18, backgroundColor: '#E8F2EE', borderWidth: 1, borderColor: '#9CBDB7', flexDirection: 'row' },
  number: { width: 43, alignItems: 'center', paddingTop: 14, borderRightWidth: 1, borderRightColor: '#9CBDB7' },
  numberText: { color: colors.teal, fontFamily: font.mono, fontSize: 13, fontWeight: '800' },
  content: { flex: 1, padding: 14 },
  label: { color: colors.teal, fontFamily: font.mono, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  title: { color: colors.ink, fontSize: 18, fontWeight: '800', lineHeight: 23, marginTop: 4 },
  body: { color: colors.body, fontSize: 15, lineHeight: 22, marginTop: 4 },
  action: { alignSelf: 'flex-start', marginTop: 10 },
});
