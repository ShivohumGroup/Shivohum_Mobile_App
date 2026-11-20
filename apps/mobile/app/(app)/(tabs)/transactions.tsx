import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar, SegmentedButtons, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { formatInr } from '@siteflow/shared';
import { Screen } from '@/components/Screen';
import { TransactionItem } from '@/components/TransactionItem';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { useMergedTransactions } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function TransactionsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('ALL');
  const { data, isLoading, isRefetching, error, refetch } = useMergedTransactions({ pageSize: 100 });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (kind !== 'ALL') list = list.filter((t) => t.kind === kind);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.siteName || '').toLowerCase().includes(q) ||
          (t.referenceNumber || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, kind, search]);

  const totals = useMemo(() => {
    const list = data ?? [];
    let income = 0;
    let expense = 0;
    for (const t of list) {
      if (t.status === 'VOIDED') continue;
      if (t.kind === 'INCOME') income += Number(t.amount) || 0;
      if (t.kind === 'EXPENSE') {
        // Available deducts cash paid, not unpaid bill amount
        expense += Number(t.amountPaid ?? t.amount) || 0;
      }
    }
    return { income, expense, available: income - expense };
  }, [data]);

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Searchbar
        placeholder="Search transactions"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <View style={styles.totals}>
        <View style={styles.totalCell}>
          <Text style={styles.totalLabel}>Received</Text>
          <Text style={[styles.totalValue, { color: colors.success }]}>{formatInr(totals.income)}</Text>
        </View>
        <View style={styles.totalCell}>
          <Text style={styles.totalLabel}>Expenses</Text>
          <Text style={[styles.totalValue, { color: colors.danger }]}>{formatInr(totals.expense)}</Text>
        </View>
        <View style={styles.totalCell}>
          <Text style={styles.totalLabel}>Available</Text>
          <Text style={[styles.totalValue, { color: colors.accent }]}>{formatInr(totals.available)}</Text>
        </View>
      </View>
      <SegmentedButtons
        value={kind}
        onValueChange={setKind}
        style={styles.seg}
        buttons={[
          { value: 'ALL', label: 'All' },
          { value: 'INCOME', label: 'Income' },
          { value: 'EXPENSE', label: 'Expense' },
        ]}
      />

      {error ? <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} /> : null}

      {filtered.map((tx) => (
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

      {!isLoading && filtered.length === 0 ? (
        <EmptyState title="No transactions" description="Income and expenses will show up here." />
      ) : null}
      <View style={{ height: 72 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: 10, borderRadius: 14 },
  totals: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  totalCell: { flex: 1 },
  totalLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  totalValue: { marginTop: 2, fontSize: 13, fontWeight: '800' },
  seg: { marginBottom: 12 },
});
