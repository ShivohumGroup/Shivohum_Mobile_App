import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScheduleCard } from '@/components/ScheduleCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { useScheduleList } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function ScheduleTabScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('OPEN');
  const { data, isLoading, isRefetching, error, refetch } = useScheduleList({
    search: search || undefined,
    pageSize: 100,
  });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (status === 'OPEN') {
      list = list.filter((t) => t.status === 'PLANNED' || t.status === 'IN_PROGRESS');
    } else if (status === 'DONE') {
      list = list.filter((t) => t.status === 'DONE');
    } else if (status === 'CANCELLED') {
      list = list.filter((t) => t.status === 'CANCELLED');
    }
    return list;
  }, [data, status]);

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Searchbar
        placeholder="Search tasks (excavation, plumber…)"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <SegmentedButtons
        value={status}
        onValueChange={setStatus}
        style={styles.seg}
        buttons={[
          { value: 'OPEN', label: 'Upcoming' },
          { value: 'DONE', label: 'Done' },
          { value: 'ALL', label: 'All' },
        ]}
      />

      <Button
        mode="contained"
        icon="plus"
        buttonColor={colors.accent}
        onPress={() => router.push('/(app)/schedule/create')}
        style={styles.addBtn}
        contentStyle={{ height: 46 }}
      >
        Add schedule task
      </Button>

      {error ? <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} /> : null}

      {filtered.map((item) => (
        <ScheduleCard
          key={item.id}
          item={item}
          onPress={() => router.push(`/(app)/schedule/${item.id}`)}
        />
      ))}

      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          title="No scheduled tasks"
          description="Plan next-day work like excavation, material delivery, or call plumber."
          actionLabel="Add task"
          onAction={() => router.push('/(app)/schedule/create')}
        />
      ) : null}
      <View style={{ height: 72 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: 10, borderRadius: 14 },
  seg: { marginBottom: 10 },
  addBtn: { marginBottom: 12, borderRadius: 12 },
});
