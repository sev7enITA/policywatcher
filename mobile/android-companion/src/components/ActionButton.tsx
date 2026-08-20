import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  tone?: 'primary' | 'secondary' | 'quiet' | 'danger';
  disabled?: boolean;
  compact?: boolean;
  accessibilityLabel?: string;
}

export function ActionButton({ label, onPress, icon, tone = 'secondary', disabled, compact, accessibilityLabel }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[tone], compact && styles.compact, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <View style={styles.content}>
        {icon ? <MaterialCommunityIcons name={icon} size={19} color={tone === 'primary' ? colors.white : tone === 'danger' ? colors.rust : colors.ink} /> : null}
        <Text style={[styles.label, tone === 'primary' && styles.primaryLabel, tone === 'danger' && styles.dangerLabel]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.ruleStrong,
    backgroundColor: colors.paperBright,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  primary: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  secondary: { backgroundColor: colors.paperBright },
  quiet: { backgroundColor: 'transparent', borderColor: colors.rule },
  danger: { backgroundColor: '#FFF8F4', borderColor: '#D8AEA5' },
  compact: { minHeight: 48, paddingHorizontal: 12 },
  pressed: { opacity: 0.72, transform: [{ translateY: 1 }] },
  disabled: { opacity: 0.45 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700', letterSpacing: 0.1, textAlign: 'center' },
  primaryLabel: { color: colors.white },
  dangerLabel: { color: colors.rust },
});
