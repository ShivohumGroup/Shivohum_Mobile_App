import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema } from '@siteflow/shared';
import { z } from 'zod';
import { useAuth } from '@/auth/AuthContext';
import { authApi } from '@/api/auth';
import { Screen } from '@/components/Screen';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

type FormValues = z.infer<typeof changePasswordSchema>;

export default function ProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    setMessage(null);
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      setMessage('Password updated');
      reset({ currentPassword: '', newPassword: '' });
      await refreshProfile();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.phone || 'No phone on file'}</Text>
        <Text style={styles.role}>{user?.role?.replace(/_/g, ' ')}</Text>
      </View>

      <Text style={styles.section}>Change password</Text>
      <Controller
        control={control}
        name="currentPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Current password"
            mode="outlined"
            secureTextEntry
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!errors.currentPassword}
          />
        )}
      />
      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="New password"
            mode="outlined"
            secureTextEntry
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!errors.newPassword}
          />
        )}
      />
      {formError ? <HelperText type="error">{formError}</HelperText> : null}
      {message ? <HelperText type="info">{message}</HelperText> : null}
      <Button
        mode="contained"
        buttonColor={colors.accent}
        loading={submitting}
        disabled={submitting}
        onPress={onSubmit}
        style={styles.btn}
      >
        Update password
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  meta: { color: '#94A3B8', marginTop: 4 },
  role: { marginTop: 10, color: colors.accentSoft, fontWeight: '700' },
  section: { fontWeight: '700', color: colors.primary, marginBottom: 8 },
  input: { marginBottom: 8, backgroundColor: colors.surface },
  btn: { borderRadius: 12, marginTop: 4 },
});
