import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDateIst, formatInr } from '@siteflow/shared';
import type { UnifiedTransaction } from '@/types/api';
import { StatusBadge } from './StatusBadge';
import { colors } from '@/theme/colors';

interface Props {
  item: UnifiedTransaction;
  onPress?: () => void;
}

export function TransactionItem({ item, onPress }: Props) {
  const isIn = item.kind === 'INCOME';
  const icon = isIn ? 'arrow-down-bold-circle' : 'arrow-up-bold-circle';
  const tint = isIn ? colors.success : colors.danger;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}>
      <View style={[styles.iconWrap, { backgroundColor: isIn ? '#D1FAE5' : '#FEE2E2' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={tint} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.siteName || item.subtitle || item.kind} · {formatDateIst(item.date)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: tint }]}>
          {isIn ? '+' : '-'}
          {formatInr(item.amount)}
        </Text>
        <StatusBadge status={String(item.status)} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: colors.primary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 13, fontWeight: '700' },
});
