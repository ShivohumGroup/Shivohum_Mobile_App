import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { formatDateIst, formatInr } from '@siteflow/shared';
import { financeApi } from '@/api/finance';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorView } from '@/components/ErrorView';
import { errorMessage, paymentMethodLabel } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function TransactionDetailsScreen() {
  const { id, kind = 'INCOME' } = useLocalSearchParams<{ id: string; kind?: string }>();
  const router = useRouter();
  const isExpense = kind === 'EXPENSE';

  const q = useQuery({
    queryKey: [isExpense ? 'expense' : 'income', id],
    queryFn: () => (isExpense ? financeApi.getExpense(id) : financeApi.getIncome(id)),
    enabled: !!id,
  });

  if (q.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (q.error || !q.data) {
    return (
      <Screen>
        <ErrorView message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      </Screen>
    );
  }

  const data = q.data as Awaited<ReturnType<typeof financeApi.getExpense>> &
    Awaited<ReturnType<typeof financeApi.getIncome>>;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.kind}>{isExpense ? 'Expense' : 'Income'}</Text>
          <StatusBadge
            status={String(isExpense ? (data as { paymentStatus?: string }).paymentStatus || data.status : data.status)}
          />
        </View>
        <Text style={styles.amount}>{formatInr(data.amount)}</Text>
        <Row label="Site" value={data.site?.name || data.siteId} />
        <Row
          label="Date"
          value={formatDateIst(
            isExpense
              ? (data as { expenseDate: string }).expenseDate
              : (data as { dateReceived: string }).dateReceived,
          )}
        />
        <Row label="Method" value={paymentMethodLabel(data.paymentMethod)} />
        <Row label="Reference" value={data.referenceNumber || '—'} />
        <Row label="Description" value={data.description || '—'} />
        {isExpense ? (
          <>
            <Row label="Paid" value={formatInr((data as { amountPaid: string | number }).amountPaid)} />
            <Row label="Category" value={(data as { category?: { name: string } }).category?.name || '—'} />
            <Row label="Vendor" value={(data as { vendorName?: string }).vendorName || '—'} />
          </>
        ) : null}
      </View>

      {isExpense ? (
        <Button
          mode="contained"
          buttonColor={colors.accent}
          style={styles.btn}
          onPress={() => router.push(`/(app)/expenses/${id}/pay`)}
        >
          Record payment
        </Button>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kind: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  amount: { fontSize: 28, fontWeight: '800', color: colors.primary, marginVertical: 12 },
  metaRow: { marginTop: 10 },
  label: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  value: { fontSize: 14, color: colors.text, marginTop: 2 },
  btn: { marginTop: 16, borderRadius: 12 },
});
