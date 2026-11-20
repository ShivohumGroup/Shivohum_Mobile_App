import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatDateIst } from '@siteflow/shared';
import type { ScheduleTask } from '@/types/api';
import { StatusBadge } from './StatusBadge';
import { colors } from '@/theme/colors';

interface Props {
  item: ScheduleTask;
  onPress: () => void;
}

export function ScheduleCard({ item, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatDateIst(item.scheduledDate)}
            {item.site?.name ? ` · ${item.site.name}` : ''}
            {item.category ? ` · ${item.category}` : ''}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      {item.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {item.notes}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { opacity: 0.92 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: colors.primary },
  meta: { marginTop: 4, fontSize: 12, color: colors.textSecondary },
  notes: { marginTop: 8, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
