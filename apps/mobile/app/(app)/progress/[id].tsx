import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { formatDateIst, formatDateTimeIst } from '@siteflow/shared';
import { Screen } from '@/components/Screen';
import { ErrorView } from '@/components/ErrorView';
import { useProgress } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function ProgressDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useProgress(id);
  const item = q.data;

  if (q.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (q.error || !item) {
    return (
      <Screen>
        <ErrorView message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <View style={styles.card}>
        <Text style={styles.date}>{formatDateIst(item.updateDate)}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.site?.name || 'Site'} · {item.createdBy?.fullName || 'Team'} ·{' '}
          {formatDateTimeIst(item.createdAt)}
        </Text>
        {typeof item.completionPercent === 'number' ? (
          <Text style={styles.pct}>{item.completionPercent}% complete</Text>
        ) : null}
        <Text style={styles.body}>{item.description}</Text>
        {item.workCategory ? <Field label="Category" value={item.workCategory} /> : null}
        {item.completedWork ? <Field label="Completed" value={item.completedWork} /> : null}
        {item.workInProgress ? <Field label="In progress" value={item.workInProgress} /> : null}
        {item.blockers ? <Field label="Blockers" value={item.blockers} /> : null}
        {item.nextDayPlan ? <Field label="Next day" value={item.nextDayPlan} /> : null}
      </View>

      {(item.photos ?? []).length > 0 ? (
        <View style={styles.gallery}>
          <Text style={styles.galleryTitle}>Photos</Text>
          <View style={styles.grid}>
            {item.photos!.map((p) => {
              const uri = p.url || p.attachment?.url;
              if (!uri) return null;
              return <Image key={p.id} source={{ uri }} style={styles.photo} />;
            })}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  date: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  title: { marginTop: 4, fontSize: 20, fontWeight: '800', color: colors.primary },
  meta: { marginTop: 6, color: colors.textSecondary, fontSize: 12 },
  pct: { marginTop: 8, color: colors.accent, fontWeight: '700' },
  body: { marginTop: 12, color: colors.text, lineHeight: 22 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  fieldValue: { marginTop: 2, color: colors.text, lineHeight: 20 },
  gallery: { marginTop: 14 },
  galleryTitle: { fontWeight: '700', color: colors.primary, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: '48%', aspectRatio: 1, borderRadius: 12, backgroundColor: colors.surfaceAlt },
});
