import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, HelperText, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatDateIst, ScheduleTaskStatus } from '@siteflow/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '@/api/schedule';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorView } from '@/components/ErrorView';
import { useScheduleTask } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const taskQ = useScheduleTask(id);
  const [error, setError] = useState<string | null>(null);

  const updateMut = useMutation({
    mutationFn: (status: ScheduleTaskStatus) => scheduleApi.update(id, { status }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['schedule'] });
      await qc.invalidateQueries({ queryKey: ['schedule', id] });
      setError(null);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: () => scheduleApi.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['schedule'] });
      router.back();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  if (taskQ.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (taskQ.error || !taskQ.data) {
    return (
      <Screen>
        <ErrorView message={errorMessage(taskQ.error)} onRetry={() => void taskQ.refetch()} />
      </Screen>
    );
  }

  const task = taskQ.data;
  const busy = updateMut.isPending || deleteMut.isPending;

  return (
    <Screen>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>{task.title}</Text>
          <StatusBadge status={task.status} />
        </View>
        <Text style={styles.meta}>Date: {formatDateIst(task.scheduledDate)}</Text>
        {task.site?.name ? <Text style={styles.meta}>Site: {task.site.name}</Text> : null}
        {task.category ? <Text style={styles.meta}>Category: {task.category}</Text> : null}
        {task.createdBy?.fullName ? (
          <Text style={styles.meta}>Created by: {task.createdBy.fullName}</Text>
        ) : null}
        {task.notes ? <Text style={styles.notes}>{task.notes}</Text> : null}
      </View>

      <Text style={styles.section}>Update status</Text>
      <View style={styles.actions}>
        <Button
          mode="outlined"
          disabled={busy || task.status === ScheduleTaskStatus.PLANNED}
          onPress={() => updateMut.mutate(ScheduleTaskStatus.PLANNED)}
          style={styles.half}
        >
          Planned
        </Button>
        <Button
          mode="outlined"
          disabled={busy || task.status === ScheduleTaskStatus.IN_PROGRESS}
          onPress={() => updateMut.mutate(ScheduleTaskStatus.IN_PROGRESS)}
          style={styles.half}
        >
          In progress
        </Button>
      </View>
      <View style={styles.actions}>
        <Button
          mode="contained"
          buttonColor={colors.success}
          disabled={busy || task.status === ScheduleTaskStatus.DONE}
          onPress={() => updateMut.mutate(ScheduleTaskStatus.DONE)}
          style={styles.half}
        >
          Mark done
        </Button>
        <Button
          mode="outlined"
          textColor={colors.danger}
          disabled={busy || task.status === ScheduleTaskStatus.CANCELLED}
          onPress={() => updateMut.mutate(ScheduleTaskStatus.CANCELLED)}
          style={styles.half}
        >
          Cancel
        </Button>
      </View>

      {error ? <HelperText type="error">{error}</HelperText> : null}

      <Button
        mode="text"
        textColor={colors.danger}
        disabled={busy}
        loading={deleteMut.isPending}
        onPress={() => deleteMut.mutate()}
        style={{ marginTop: 16 }}
      >
        Delete task
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.primary },
  meta: { marginTop: 4, color: colors.textSecondary, fontSize: 13 },
  notes: { marginTop: 12, color: colors.text, lineHeight: 20 },
  section: { fontWeight: '700', color: colors.primary, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  half: { flex: 1, borderRadius: 12 },
});
