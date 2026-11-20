import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Searchbar, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Redirect } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';
import { teamApi } from '@/api/team';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { unwrapList, errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function TeamListScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const q = useQuery({
    queryKey: ['team', search],
    queryFn: async () => unwrapList(await teamApi.list({ search: search || undefined, pageSize: 100 })),
    enabled: isAdmin,
  });

  const users = useMemo(() => q.data || [], [q.data]);

  if (!isAdmin) return <Redirect href="/(app)/(tabs)/more" />;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <Text style={styles.title}>Team</Text>
      <Text style={styles.sub}>Invite members and assign them to your sites. Admins see all sites.</Text>

      <Button
        mode="contained"
        icon="account-plus"
        buttonColor={colors.accent}
        style={styles.btn}
        onPress={() => router.push('/(app)/team/invite')}
      >
        Invite team member
      </Button>

      <Searchbar
        placeholder="Search name or email"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {q.error ? <ErrorView message={errorMessage(q.error)} onRetry={() => void q.refetch()} /> : null}

      {users.map((u) => (
        <Button
          key={u.id}
          mode="outlined"
          style={styles.card}
          contentStyle={styles.cardContent}
          onPress={() => router.push(`/(app)/team/${u.id}`)}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.fullName}</Text>
              <Text style={styles.meta}>{u.email}</Text>
              <View style={styles.chips}>
                <Chip compact style={styles.chip}>
                  {u.role.replace(/_/g, ' ')}
                </Chip>
                <Chip compact style={styles.chip} selected={u.isActive}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </Chip>
              </View>
              <Text style={styles.meta}>
                Sites: {u.memberships?.length ? u.memberships.map((m) => m.site?.code || m.siteId.slice(0, 6)).join(', ') : 'All (admin) / none'}
              </Text>
            </View>
          </View>
        </Button>
      ))}

      {!q.isLoading && users.length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Invite partners, managers, or viewers and assign project sites."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.primary },
  sub: { color: colors.textSecondary, marginBottom: 12, marginTop: 4, lineHeight: 20 },
  btn: { borderRadius: 12, marginBottom: 12 },
  search: { marginBottom: 12, borderRadius: 14 },
  card: {
    marginBottom: 10,
    borderRadius: 14,
    borderColor: colors.border,
    justifyContent: 'flex-start',
  },
  cardContent: { paddingVertical: 8 },
  row: { width: '100%', alignItems: 'flex-start' },
  name: { fontWeight: '700', color: colors.primary, fontSize: 16, textAlign: 'left' },
  meta: { color: colors.textSecondary, marginTop: 2, textAlign: 'left', fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { height: 28 },
});
