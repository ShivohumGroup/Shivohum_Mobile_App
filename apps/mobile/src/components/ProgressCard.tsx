import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatDateIst } from '@siteflow/shared';
import type { ProgressUpdate } from '@/types/api';
import { colors } from '@/theme/colors';

interface Props {
  item: ProgressUpdate;
  onPress?: () => void;
}

export function ProgressCard({ item, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
      <View style={styles.row}>
        <Text style={styles.date}>{formatDateIst(item.updateDate)}</Text>
        {typeof item.completionPercent === 'number' ? (
          <Text style={styles.pct}>{item.completionPercent}%</Text>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.desc} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.meta}>
        {item.site?.name || 'Site'} · {item.createdBy?.fullName || 'Team'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  date: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  pct: { fontSize: 12, color: colors.accent, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', color: colors.primary },
  desc: { marginTop: 4, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  meta: { marginTop: 8, fontSize: 11, color: colors.textSecondary },
});
