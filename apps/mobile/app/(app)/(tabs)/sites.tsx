import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ProjectStatus } from '@siteflow/shared';
import { useAuth } from '@/auth/AuthContext';
import { Screen } from '@/components/Screen';
import { SiteCard } from '@/components/SiteCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { useSites } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function SitesScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const { data, isLoading, isRefetching, error, refetch } = useSites({
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
    pageSize: 100,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (status === 'ALL') return data;
    return data.filter((s) => s.status === status);
  }, [data, status]);

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      {isAdmin ? (
        <Button
          mode="contained"
          icon="plus"
          buttonColor={colors.accent}
          style={styles.createBtn}
          onPress={() => router.push('/(app)/sites/create')}
        >
          Create site
        </Button>
      ) : null}
      <Searchbar
        placeholder="Search sites or clients"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <SegmentedButtons
        value={status}
        onValueChange={setStatus}
        style={styles.seg}
        buttons={[
          { value: 'ALL', label: 'All' },
          { value: ProjectStatus.ACTIVE, label: 'Active' },
          { value: ProjectStatus.PLANNING, label: 'Plan' },
          { value: ProjectStatus.COMPLETED, label: 'Done' },
        ]}
      />

      {error ? <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} /> : null}

      {filtered.map((site) => (
        <SiteCard key={site.id} site={site} onPress={() => router.push(`/(app)/sites/${site.id}`)} />
      ))}

      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          title="No sites found"
          description={
            isAdmin
              ? 'Create your first project site to start recording expenses and progress.'
              : 'Ask your admin to assign you to a site.'
          }
        />
      ) : null}
      <View style={{ height: 72 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  createBtn: { borderRadius: 12, marginBottom: 10 },
  search: { marginBottom: 10, borderRadius: 14 },
  seg: { marginBottom: 12 },
});
