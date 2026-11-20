import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDateTimeIst } from '@siteflow/shared';
import { notificationsApi } from '@/api/notifications';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { useNotifications } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const { data, isLoading, isRefetching, error, refetch } = useNotifications({ pageSize: 50 });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Button
        mode="outlined"
        onPress={() => markAll.mutate()}
        loading={markAll.isPending}
        disabled={markAll.isPending}
        style={styles.markAll}
      >
        Mark all read
      </Button>

      {error ? <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} /> : null}

      {(data ?? []).map((n) => (
        <Pressable
          key={n.id}
          onPress={() => {
            if (!n.isRead) markRead.mutate(n.id);
          }}
          style={[styles.card, !n.isRead && styles.unread]}
        >
          <Text style={styles.title}>{n.title}</Text>
          <Text style={styles.body}>{n.body}</Text>
          <Text style={styles.time}>{formatDateTimeIst(n.createdAt)}</Text>
        </Pressable>
      ))}

      {!isLoading && !(data?.length) ? (
        <EmptyState title="All caught up" description="Notifications from site activity will show here." icon="bell-outline" />
      ) : null}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Push delivery requires Expo project credentials and device registration. In-app notifications work via the API.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  markAll: { marginBottom: 12, borderRadius: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.accent },
  title: { fontWeight: '700', color: colors.primary },
  body: { marginTop: 4, color: colors.textSecondary, lineHeight: 18 },
  time: { marginTop: 8, fontSize: 11, color: colors.textSecondary },
  note: { marginTop: 16, padding: 12, backgroundColor: colors.surfaceAlt, borderRadius: 12 },
  noteText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});
