import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Checkbox, HelperText, Text } from 'react-native-paper';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthContext';
import { teamApi } from '@/api/team';
import { useSites } from '@/hooks/queries';
import { Screen } from '@/components/Screen';
import { ErrorView } from '@/components/ErrorView';
import { LoadingScreen } from '@/components/LoadingScreen';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/lib/utils';

export default function TeamMemberScreen() {
  const { isAdmin, user: me } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const sitesQ = useSites({ pageSize: 100 });
  const memberQ = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamApi.get(id),
    enabled: isAdmin && !!id,
  });
  const [siteIds, setSiteIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberQ.data?.memberships) {
      setSiteIds(memberQ.data.memberships.map((m) => m.siteId));
    }
  }, [memberQ.data]);

  const sites = useMemo(() => sitesQ.data || [], [sitesQ.data]);
  const isOrgAdmin =
    memberQ.data?.role === 'ADMIN' || memberQ.data?.role === 'SUPER_ADMIN';

  const saveMemberships = useMutation({
    mutationFn: () => teamApi.setMemberships(id, siteIds),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['team'] });
      setMessage('Site access updated.');
      setError(null);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const toggleActive = useMutation({
    mutationFn: async () => {
      if (!memberQ.data) return;
      return memberQ.data.isActive ? teamApi.deactivate(id) : teamApi.activate(id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['team'] });
      await memberQ.refetch();
      setMessage('Status updated.');
    },
    onError: (err) => setError(errorMessage(err)),
  });

  if (!isAdmin) return <Redirect href="/(app)/(tabs)/more" />;
  if (memberQ.isLoading) return <LoadingScreen />;
  if (memberQ.error || !memberQ.data) {
    return <ErrorView message={errorMessage(memberQ.error)} onRetry={() => void memberQ.refetch()} />;
  }

  const member = memberQ.data;

  return (
    <Screen>
      <Text style={styles.title}>{member.fullName}</Text>
      <Text style={styles.meta}>{member.email}</Text>
      <Text style={styles.meta}>
        {member.role.replace(/_/g, ' ')} · {member.isActive ? 'Active' : 'Inactive'}
      </Text>

      {isOrgAdmin ? (
        <HelperText type="info">
          This user is an admin and can see all organisation sites automatically.
        </HelperText>
      ) : (
        <>
          <Text style={styles.label}>Assigned sites</Text>
          {sites.map((site) => {
            const checked = siteIds.includes(site.id);
            return (
              <Checkbox.Item
                key={site.id}
                label={`${site.name} (${site.code})`}
                status={checked ? 'checked' : 'unchecked'}
                onPress={() => {
                  setSiteIds((prev) =>
                    checked ? prev.filter((x) => x !== site.id) : [...prev, site.id],
                  );
                }}
              />
            );
          })}
          <Button
            mode="contained"
            buttonColor={colors.accent}
            style={styles.btn}
            loading={saveMemberships.isPending}
            onPress={() => saveMemberships.mutate()}
          >
            Save site access
          </Button>
        </>
      )}

      {me?.id !== member.id ? (
        <Button
          mode="outlined"
          style={styles.btn}
          textColor={member.isActive ? colors.danger : colors.accent}
          loading={toggleActive.isPending}
          onPress={() => toggleActive.mutate()}
        >
          {member.isActive ? 'Deactivate user' : 'Activate user'}
        </Button>
      ) : null}

      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {error ? <HelperText type="error">{error}</HelperText> : null}

      <Button mode="text" onPress={() => router.back()}>
        Back
      </Button>
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.primary },
  meta: { color: colors.textSecondary, marginTop: 4 },
  label: { marginTop: 16, marginBottom: 6, fontWeight: '700', color: colors.primary },
  btn: { marginTop: 12, borderRadius: 12 },
  ok: { marginTop: 10, color: colors.accent, fontWeight: '600' },
});
