import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { formatInr } from '@siteflow/shared';
import { Screen } from '@/components/Screen';
import { SummaryCard } from '@/components/SummaryCard';
import { ErrorView } from '@/components/ErrorView';
import { useSite, useSiteSummary } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function SiteFinancialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const siteQ = useSite(id);
  const summaryQ = useSiteSummary(id);
  const s = summaryQ.data;

  if (summaryQ.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (summaryQ.error || !s) {
    return (
      <Screen>
        <ErrorView
          message={errorMessage(summaryQ.error, 'Could not load financial summary')}
          onRetry={() => void summaryQ.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={summaryQ.isRefetching} onRefresh={() => void summaryQ.refetch()}>
      <Text style={styles.title}>{siteQ.data?.name || 'Site'} finances</Text>
      <View style={styles.grid}>
        <SummaryCard label="Contract / budget" value={formatInr(s.contractAmount)} />
        <SummaryCard label="Received from client" value={formatInr(s.totalReceived)} accent={colors.success} />
        <SummaryCard
          label="Available cash"
          value={formatInr(s.availableAmount ?? s.netCash)}
          hint="Received − expenses paid"
          accent={colors.accent}
        />
        <SummaryCard label="Client still owed" value={formatInr(s.outstanding)} accent={colors.warning} />
        <SummaryCard label="Overpayment" value={formatInr(s.overpayment)} />
        <SummaryCard
          label="Expenses incurred"
          value={formatInr(s.totalExpensesIncurred)}
          hint="All bills (paid + unpaid)"
        />
        <SummaryCard
          label="Expenses paid out"
          value={formatInr(s.totalExpensesPaid)}
          accent={colors.danger}
        />
        <SummaryCard
          label="Vendor unpaid"
          value={formatInr(s.expensesOutstanding)}
          accent={colors.warning}
        />
        <SummaryCard label="Est. margin" value={formatInr(s.margin)} accent={colors.info} />
        <SummaryCard
          label="Counts"
          value={`${s.incomeCount} in / ${s.expenseCount} exp`}
          hint="Confirmed records"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
});
