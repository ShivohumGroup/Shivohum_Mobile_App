import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/theme/colors';

interface Props {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  onPress?: () => void;
}

export function SummaryCard({ label, value, hint, accent = colors.accent, onPress }: Props) {
  return (
    <View style={[styles.card, onPress ? styles.pressable : null]} onTouchEnd={onPress}>
      <View style={[styles.bar, { backgroundColor: accent }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: 'hidden',
  },
  pressable: { opacity: 1 },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 6,
  },
  value: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 6,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 6,
  },
});
