import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ProgressCard } from '@/components/ProgressCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { useProgressList } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function ProgressTabScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data, isLoading, isRefetching, error, refetch } = useProgressList({
    search: search || undefined,
    pageSize: 50,
  });

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Searchbar
        placeholder="Search progress updates"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="plus"
          buttonColor={colors.accent}
          onPress={() => router.push('/(app)/progress/create')}
          style={{ flex: 1, borderRadius: 12 }}
        >
          Add update
        </Button>
        <Button
          mode="outlined"
          icon="image-multiple"
          textColor={colors.primary}
          onPress={() => router.push('/(app)/progress/gallery')}
          style={{ flex: 1, borderRadius: 12 }}
        >
          Gallery
        </Button>
      </View>

      {error ? <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} /> : null}

      {(data ?? []).map((item) => (
        <ProgressCard
          key={item.id}
          item={item}
          onPress={() => router.push(`/(app)/progress/${item.id}`)}
        />
      ))}

      {!isLoading && !(data?.length) ? (
        <EmptyState
          title="No progress yet"
          description="Post daily site updates with photos for the team."
          actionLabel="Add progress"
          onAction={() => router.push('/(app)/progress/create')}
        />
      ) : null}
      <View style={{ height: 72 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: 10, borderRadius: 14 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
});
