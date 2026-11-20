import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Searchbar, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { useContacts } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function ContactsScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();
  const [search, setSearch] = useState('');
  const { data, isLoading, isRefetching, error, refetch } = useContacts({
    search: search || undefined,
    siteId,
    pageSize: 100,
  });

  const list = useMemo(() => data ?? [], [data]);

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Searchbar
        placeholder="Search name, phone, category"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <Button
        mode="contained"
        icon="account-plus"
        buttonColor={colors.accent}
        style={styles.add}
        onPress={() =>
          router.push({
            pathname: '/(app)/contacts/create',
            params: siteId ? { siteId } : {},
          })
        }
      >
        Add contact
      </Button>

      {error ? <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} /> : null}

      {list.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => router.push(`/(app)/contacts/${c.id}`)}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.name}>{c.personName}</Text>
          <Text style={styles.sub}>
            {c.workCategory}
            {c.companyName ? ` · ${c.companyName}` : ''}
          </Text>
          <Text style={styles.phone}>{c.primaryPhone}</Text>
          {!c.isActive ? <Text style={styles.inactive}>Inactive</Text> : null}
        </Pressable>
      ))}

      {!isLoading && list.length === 0 ? (
        <EmptyState
          title="No contacts"
          description="Add contractors, vendors, and site people here."
          actionLabel="Add contact"
          onAction={() => router.push('/(app)/contacts/create')}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: 10, borderRadius: 14 },
  add: { marginBottom: 12, borderRadius: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.primary },
  sub: { marginTop: 2, color: colors.textSecondary, fontSize: 13 },
  phone: { marginTop: 6, color: colors.accent, fontWeight: '700' },
  inactive: { marginTop: 4, color: colors.danger, fontSize: 12, fontWeight: '600' },
});
