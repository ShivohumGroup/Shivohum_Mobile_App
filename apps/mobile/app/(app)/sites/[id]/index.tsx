import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatDateIst, formatInr } from '@siteflow/shared';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { SummaryCard } from '@/components/SummaryCard';
import { ErrorView } from '@/components/ErrorView';
import { useSite, useSiteSummary } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function SiteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const siteQ = useSite(id);
  const summaryQ = useSiteSummary(id);
  const site = siteQ.data;
  const summary = summaryQ.data;

  if (siteQ.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (siteQ.error || !site) {
    return (
      <Screen>
        <ErrorView message={errorMessage(siteQ.error, 'Site not found')} onRetry={() => void siteQ.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={siteQ.isRefetching || summaryQ.isRefetching}
      onRefresh={() => {
        void siteQ.refetch();
        void summaryQ.refetch();
      }}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{site.name}</Text>
        <StatusBadge status={site.status} />
        <Text style={styles.meta}>
          {site.code} · {site.clientName}
        </Text>
        <Text style={styles.meta}>
          {site.address}, {site.city}, {site.state}
        </Text>
        <Text style={styles.meta}>Started {formatDateIst(site.agreedStartDate)}</Text>
      </View>

      <View style={styles.grid}>
        <SummaryCard label="Budget" value={formatInr(summary?.contractAmount ?? site.contractAmount)} />
        <SummaryCard
          label="Received"
          value={formatInr(summary?.totalReceived ?? site.totalReceived ?? 0)}
          accent={colors.success}
        />
        <SummaryCard
          label="Expenses paid"
          value={formatInr(summary?.totalExpensesPaid ?? site.totalExpensesPaid ?? 0)}
          accent={colors.danger}
        />
        <SummaryCard
          label="Available"
          value={formatInr(
            summary?.availableAmount ??
              summary?.netCash ??
              site.availableAmount ??
              site.netCash ??
              0,
          )}
          accent={colors.accent}
        />
      </View>

      <Button
        mode="contained"
        buttonColor={colors.primary}
        style={styles.btn}
        onPress={() => router.push(`/(app)/sites/${id}/financial`)}
      >
        Full financial summary
      </Button>

      <View style={styles.actions}>
        <Button mode="outlined" style={styles.half} onPress={() => router.push({ pathname: '/(app)/income/create', params: { siteId: id } })}>
          Add income
        </Button>
        <Button mode="outlined" style={styles.half} onPress={() => router.push({ pathname: '/(app)/expenses/create', params: { siteId: id } })}>
          Add expense
        </Button>
      </View>
      <View style={styles.actions}>
        <Button mode="outlined" style={styles.half} onPress={() => router.push({ pathname: '/(app)/progress/create', params: { siteId: id } })}>
          Progress
        </Button>
        <Button mode="outlined" style={styles.half} onPress={() => router.push({ pathname: '/(app)/contacts', params: { siteId: id } })}>
          Contacts
        </Button>
      </View>

      {site.description ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Description</Text>
          <Text style={styles.blockBody}>{site.description}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.primary, marginBottom: 8 },
  meta: { marginTop: 4, color: colors.textSecondary, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  btn: { marginBottom: 10, borderRadius: 12 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  half: { flex: 1, borderRadius: 12 },
  block: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  blockTitle: { fontWeight: '700', color: colors.primary, marginBottom: 6 },
  blockBody: { color: colors.textSecondary, lineHeight: 20 },
});
