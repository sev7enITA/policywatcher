import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '@/theme/tokens';

export function PageIntro({ eyebrow, title, body, aside }: { eyebrow: string; title: string; body?: string; aside?: string }) {
  return (
    <View style={styles.root}>
      <View style={styles.headingRow}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {aside ? <Text style={styles.aside}>{aside}</Text> : null}
      </View>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 18, paddingTop: 23, paddingBottom: 18 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  copy: { flex: 1 },
  eyebrow: { color: colors.teal, fontFamily: font.mono, fontWeight: '700', fontSize: 12, letterSpacing: 0.7, marginBottom: 7 },
  title: { color: colors.ink, fontSize: 29, lineHeight: 33, fontWeight: '800', letterSpacing: -0.9 },
  aside: { color: colors.indigo, fontFamily: font.mono, fontSize: 12, fontWeight: '700', borderTopWidth: 2, borderTopColor: colors.indigo, paddingTop: 5 },
  body: { color: colors.body, fontSize: 16, lineHeight: 23, marginTop: 10, maxWidth: 580 },
});
