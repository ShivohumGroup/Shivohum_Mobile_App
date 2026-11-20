import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/theme/colors';

interface Point {
  label: string;
  income: number;
  expense: number;
}

export function MonthChart({ series }: { series: Point[] }) {
  const max = useMemo(() => {
    const vals = series.flatMap((s) => [s.income, s.expense]);
    return Math.max(1, ...vals);
  }, [series]);

  if (!series.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No chart data for this period</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Monthly income vs expenses</Text>
      <View style={styles.chart}>
        {series.map((s) => (
          <View key={s.label} style={styles.col}>
            <View style={styles.bars}>
              <View
                style={[
                  styles.bar,
                  { height: `${Math.max(4, (s.income / max) * 100)}%`, backgroundColor: colors.accent },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  { height: `${Math.max(4, (s.expense / max) * 100)}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Expenses</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  title: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 6 },
  col: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, flex: 1, width: '100%', justifyContent: 'center' },
  bar: { width: 8, borderRadius: 4, minHeight: 4 },
  label: { marginTop: 6, fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textSecondary },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: { color: colors.textSecondary },
});
