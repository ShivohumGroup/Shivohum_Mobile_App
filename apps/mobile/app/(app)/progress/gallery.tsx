import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatDateIst } from '@siteflow/shared';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { useProgressList } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function ProgressGalleryScreen() {
  const { data, isLoading, isRefetching, error, refetch } = useProgressList({ pageSize: 50 });

  const photos = useMemo(() => {
    const items: Array<{ key: string; uri: string; caption: string }> = [];
    for (const update of data ?? []) {
      for (const photo of update.photos ?? []) {
        const uri = photo.url || photo.attachment?.url;
        if (!uri) continue;
        items.push({
          key: photo.id,
          uri,
          caption: `${update.site?.name || 'Site'} · ${formatDateIst(update.updateDate)}`,
        });
      }
    }
    return items;
  }, [data]);

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Text style={styles.title}>Site photo gallery</Text>
      {error ? <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} /> : null}
      <View style={styles.grid}>
        {photos.map((p) => (
          <View key={p.key} style={styles.item}>
            <Image source={{ uri: p.uri }} style={styles.image} />
            <Text style={styles.caption} numberOfLines={2}>
              {p.caption}
            </Text>
          </View>
        ))}
      </View>
      {!isLoading && photos.length === 0 ? (
        <EmptyState
          title="No photos yet"
          description="Photos attached to progress updates will appear here."
          icon="image-multiple"
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: { width: '48%' },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  caption: { marginTop: 4, fontSize: 11, color: colors.textSecondary },
});
