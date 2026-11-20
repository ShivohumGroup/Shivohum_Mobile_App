import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '@siteflow/shared';
import { z } from 'zod';
import { Link, router } from 'expo-router';
import { authApi } from '@/api/auth';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/lib/utils';

type FormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await authApi.resetPassword(values.token, values.password);
      setDone(true);
    } catch (err) {
      setFormError(errorMessage(err, 'Reset failed'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.sub}>Paste the reset token from email (or API response in development).</Text>

        {done ? (
          <>
            <HelperText type="info" visible>
              Password updated. You can sign in with the new password.
            </HelperText>
            <Button mode="contained" buttonColor={colors.accent} onPress={() => router.replace('/(auth)/login')}>
              Go to login
            </Button>
          </>
        ) : (
          <>
            <Controller
              control={control}
              name="token"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Reset token"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.token}
                  style={styles.input}
                />
              )}
            />
            {errors.token ? <HelperText type="error">{errors.token.message}</HelperText> : null}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="New password"
                  mode="outlined"
                  secureTextEntry
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.password}
                  style={styles.input}
                />
              )}
            />
            {errors.password ? <HelperText type="error">{errors.password.message}</HelperText> : null}
            {formError ? <HelperText type="error">{formError}</HelperText> : null}
            <Button
              mode="contained"
              onPress={onSubmit}
              loading={submitting}
              disabled={submitting}
              buttonColor={colors.accent}
              style={styles.btn}
            >
              Update password
            </Button>
            <Link href="/(auth)/forgot-password" style={styles.link}>
              Request a new token
            </Link>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.primary },
  sub: { marginTop: 6, marginBottom: 12, color: colors.textSecondary, lineHeight: 20 },
  input: { backgroundColor: colors.surface, marginBottom: 4 },
  btn: { marginTop: 12, borderRadius: 12 },
  link: { marginTop: 14, color: colors.accent, fontWeight: '600' },
});
