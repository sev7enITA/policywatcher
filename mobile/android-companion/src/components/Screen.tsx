import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  footer?: ReactNode;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

export function Screen({ children, scroll = true, footer, contentContainerStyle }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.frame}>
        {scroll ? (
          <ScrollView contentContainerStyle={[styles.content, contentContainerStyle]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : children}
        {footer}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: colors.paper },
  content: { paddingBottom: 28 },
});
