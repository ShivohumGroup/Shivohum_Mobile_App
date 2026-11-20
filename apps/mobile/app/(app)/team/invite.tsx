import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Checkbox, HelperText, Text, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteUserSchema, UserRole, type InviteUserInput } from '@siteflow/shared';
import { useAuth } from '@/auth/AuthContext';
import { teamApi } from '@/api/team';
import { useSites } from '@/hooks/queries';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/lib/utils';

const ROLE_OPTIONS: UserRole[] = [
  UserRole.ADMIN,
  UserRole.PARTNER,
  UserRole.SITE_MANAGER,
  UserRole.VIEWER,
];

export default function InviteTeamScreen() {
  const { isAdmin } = useAuth();
  const sitesQ = useSites({ pageSize: 100 });
  const qc = useQueryClient();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      fullName: '',
      role: UserRole.SITE_MANAGER,
      phone: '',
      siteIds: [],
      password: '',
    },
  });

  const selectedSites = watch('siteIds') || [];
  const role = watch('role');
  const sites = useMemo(() => sitesQ.data || [], [sitesQ.data]);

  const invite = useMutation({
    mutationFn: (values: InviteUserInput) =>
      teamApi.invite({
        ...values,
        phone: values.phone || null,
        password: values.password || undefined,
        siteIds: values.role === UserRole.ADMIN || values.role === UserRole.SUPER_ADMIN ? [] : values.siteIds,
      }),
    onSuccess: async (created) => {
      await qc.invalidateQueries({ queryKey: ['team'] });
      if (created.temporaryPassword) setTempPassword(created.temporaryPassword);
      else router.replace('/(app)/team');
    },
    onError: (err) => setFormError(errorMessage(err, 'Invite failed')),
  });

  if (!isAdmin) return <Redirect href="/(app)/(tabs)/more" />;

  if (tempPassword) {
    return (
      <Screen>
        <Text style={styles.title}>Member invited</Text>
        <Text style={styles.sub}>Share this temporary password securely (shown once in development):</Text>
        <View style={styles.box}>
          <Text style={styles.pw}>{tempPassword}</Text>
        </View>
        <Button mode="contained" buttonColor={colors.accent} onPress={() => router.replace('/(app)/team')}>
          Back to team
        </Button>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Invite member</Text>
      <Text style={styles.sub}>Assign sites so they can see that project’s expenses, progress and contacts.</Text>

      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput label="Full name" mode="outlined" value={value} onBlur={onBlur} onChangeText={onChange} style={styles.input} error={!!errors.fullName} />
        )}
      />
      {errors.fullName ? <HelperText type="error">{errors.fullName.message}</HelperText> : null}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput label="Email" mode="outlined" autoCapitalize="none" keyboardType="email-address" value={value} onBlur={onBlur} onChangeText={onChange} style={styles.input} error={!!errors.email} />
        )}
      />
      {errors.email ? <HelperText type="error">{errors.email.message}</HelperText> : null}

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput label="Phone (optional)" mode="outlined" keyboardType="phone-pad" value={value || ''} onBlur={onBlur} onChangeText={onChange} style={styles.input} />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Password (optional — auto if empty)"
            mode="outlined"
            secureTextEntry
            value={value || ''}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
          />
        )}
      />

      <Text style={styles.label}>Role</Text>
      <View style={styles.roles}>
        {ROLE_OPTIONS.map((r) => (
          <Button
            key={r}
            mode={role === r ? 'contained' : 'outlined'}
            compact
            style={styles.roleBtn}
            buttonColor={role === r ? colors.accent : undefined}
            onPress={() => setValue('role', r)}
          >
            {r.replace(/_/g, ' ')}
          </Button>
        ))}
      </View>

      {role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN ? (
        <>
          <Text style={styles.label}>Assign sites</Text>
          {sites.map((site) => {
            const checked = selectedSites.includes(site.id);
            return (
              <Checkbox.Item
                key={site.id}
                label={`${site.name} (${site.code})`}
                status={checked ? 'checked' : 'unchecked'}
                onPress={() => {
                  const next = checked
                    ? selectedSites.filter((id) => id !== site.id)
                    : [...selectedSites, site.id];
                  setValue('siteIds', next, { shouldValidate: true });
                }}
              />
            );
          })}
          {!sites.length ? <HelperText type="info">Create a site first, then assign it here.</HelperText> : null}
        </>
      ) : (
        <HelperText type="info">Admins automatically see all organisation sites.</HelperText>
      )}

      {formError ? <HelperText type="error">{formError}</HelperText> : null}

      <Button
        mode="contained"
        buttonColor={colors.accent}
        loading={invite.isPending}
        disabled={invite.isPending}
        style={styles.btn}
        onPress={handleSubmit((values) => {
          setFormError(null);
          invite.mutate(values);
        })}
      >
        Send invite
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.primary },
  sub: { color: colors.textSecondary, marginVertical: 8, lineHeight: 20 },
  input: { backgroundColor: colors.surface, marginBottom: 4 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: '700', color: colors.primary },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  roleBtn: { borderRadius: 10 },
  btn: { marginTop: 16, borderRadius: 12 },
  box: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  pw: { fontSize: 18, fontWeight: '700', color: colors.primary, textAlign: 'center' },
});
