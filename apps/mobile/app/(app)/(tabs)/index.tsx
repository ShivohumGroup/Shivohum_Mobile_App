import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { formatInr, getIstYearMonth, monthLabel } from '@siteflow/shared';
import { useAuth } from '@/auth/AuthContext';
import { Screen } from '@/components/Screen';
import { SummaryCard } from '@/components/SummaryCard';
import { SiteCard } from '@/components/SiteCard';
import { TransactionItem } from '@/components/TransactionItem';
import { ProgressCard } from '@/components/ProgressCard';
import { MonthChart } from '@/components/MonthChart';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { useDashboard } from '@/hooks/queries';
import { greetingForHour, errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { year, month } = getIstYearMonth();
  const { data, isLoading, isRefetching, error, refetch } = useDashboard({ year, month });

  const chartSeries = useMemo(() => {
    if (data?.monthlySeries?.length) {
      return data.monthlySeries.map((m) => ({
        label: m.label || monthLabel(m.month),
        income: Number(m.income) || 0,
        expense: Number(m.expense) || 0,
      }));
    }
    return [];
  }, [data?.monthlySeries]);

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <View style={styles.greeting}>
        <Text style={styles.hello}>
          {greetingForHour()}, {user?.fullName?.split(' ')[0] || 'there'}
        </Text>
        <Text style={styles.period}>
          {monthLabel(month)} {year} overview
        </Text>
      </View>

      {error ? <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} /> : null}

      <View style={styles.grid}>
        <SummaryCard label="Available" value={formatInr(data?.netCash ?? 0)} accent={colors.accent} />
        <SummaryCard
          label="Received"
          value={formatInr(data?.totalReceived ?? 0)}
          accent={colors.success}
        />
        <SummaryCard
          label="Expenses"
          value={formatInr(data?.totalExpensesPaid ?? 0)}
          accent={colors.danger}
        />
        <SummaryCard
          label="Active sites"
          value={String(data?.activeSites ?? (isLoading ? '…' : 0))}
          hint={`${data?.totalSites ?? 0} total`}
          accent={colors.info}
        />
      </View>

      <MonthChart series={chartSeries} />

      <SectionTitle title="Sites" action="See all" onAction={() => router.push('/(app)/(tabs)/sites')} />
      {(data?.sites ?? []).slice(0, 3).map((site) => (
        <SiteCard key={site.id} site={site} onPress={() => router.push(`/(app)/sites/${site.id}`)} />
      ))}
      {!isLoading && !(data?.sites?.length) ? (
        <EmptyState title="No sites yet" description="Sites assigned to you will appear here." />
      ) : null}

      <SectionTitle
        title="Recent transactions"
        action="History"
        onAction={() => router.push('/(app)/(tabs)/transactions')}
      />
      {(data?.recentTransactions ?? []).slice(0, 5).map((tx) => (
        <TransactionItem
          key={`${tx.kind}-${tx.id}`}
          item={tx}
          onPress={() =>
            router.push({
              pathname: '/(app)/transactions/[id]',
              params: { id: tx.id, kind: tx.kind },
            })
          }
        />
      ))}
      {!isLoading && !(data?.recentTransactions?.length) ? (
        <EmptyState title="No recent transactions" icon="swap-horizontal" />
      ) : null}

      <SectionTitle
        title="Latest progress"
        action="Timeline"
        onAction={() => router.push('/(app)/(tabs)/progress')}
      />
      {(data?.latestProgress ?? []).slice(0, 3).map((p) => (
        <ProgressCard
          key={p.id}
          item={p}
          onPress={() => router.push(`/(app)/progress/${p.id}`)}
        />
      ))}
      {!isLoading && !(data?.latestProgress?.length) ? (
        <EmptyState title="No progress updates" icon="timeline-text" />
      ) : null}
    </Screen>
  );
}

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{title}</Text>
      {action && onAction ? (
        <Text onPress={onAction} style={styles.link}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { marginBottom: 14 },
  hello: { fontSize: 24, fontWeight: '800', color: colors.primary },
  period: { marginTop: 4, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  sectionRow: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: { fontSize: 16, fontWeight: '700', color: colors.primary },
  link: { color: colors.accent, fontWeight: '700', fontSize: 13 },
});
