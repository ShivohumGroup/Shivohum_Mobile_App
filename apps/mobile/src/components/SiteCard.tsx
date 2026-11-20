import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { formatInr } from '@siteflow/shared';
import type { Site } from '@/types/api';
import { StatusBadge } from './StatusBadge';
import { colors } from '@/theme/colors';

interface Props {
  site: Site;
  onPress: () => void;
}

export function SiteCard({ site, onPress }: Props) {
  const received = site.totalReceived ?? 0;
  const paid = site.totalExpensesPaid ?? 0;
  const net = site.availableAmount ?? site.netCash ?? Number(received) - Number(paid);
  const progress =
    typeof site.completionPercent === 'number' ? Math.min(100, Math.max(0, site.completionPercent)) / 100 : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {site.name}
          </Text>
          <Text style={styles.client} numberOfLines={1}>
            {site.clientName} · {site.city}
          </Text>
        </View>
        <StatusBadge status={site.status} />
      </View>

      <View style={styles.metrics}>
        <Metric label="Budget" value={formatInr(site.contractAmount)} />
        <Metric label="Received" value={formatInr(received)} />
        <Metric label="Expenses" value={formatInr(paid)} />
        <Metric label="Available" value={formatInr(net)} />
      </View>

      {progress !== null ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressLabel}>{Math.round(progress * 100)}%</Text>
          </View>
          <ProgressBar progress={progress} color={colors.accent} style={styles.bar} />
        </View>
      ) : null}
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pressed: { opacity: 0.92 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.primary },
  client: { marginTop: 2, fontSize: 13, color: colors.textSecondary },
  metrics: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metric: { width: '50%', marginBottom: 8 },
  metricLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  metricValue: { fontSize: 13, color: colors.text, fontWeight: '700', marginTop: 2 },
  progressWrap: { marginTop: 4 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  bar: { height: 6, borderRadius: 999, backgroundColor: colors.surfaceAlt },
});
