import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '@siteflow/shared';
import { z } from 'zod';
import { Link } from 'expo-router';
import { authApi } from '@/api/auth';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/lib/utils';

type FormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await authApi.forgotPassword(values.email);
      setDone(true);
    } catch (err) {
      setFormError(errorMessage(err, 'Request failed'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.sub}>
          Enter your account email. If it exists, we will send reset instructions.
        </Text>

        {done ? (
          <>
            <HelperText type="info" visible>
              If an account exists for that email, reset instructions have been sent.
            </HelperText>
            <Link href="/(auth)/reset-password" style={styles.link}>
              I already have a reset token
            </Link>
          </>
        ) : (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email"
                  mode="outlined"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.email}
                  style={styles.input}
                />
              )}
            />
            {errors.email ? <HelperText type="error">{errors.email.message}</HelperText> : null}
            {formError ? <HelperText type="error">{formError}</HelperText> : null}
            <Button
              mode="contained"
              onPress={onSubmit}
              loading={submitting}
              disabled={submitting}
              buttonColor={colors.accent}
              style={styles.btn}
            >
              Send reset link
            </Button>
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
  input: { backgroundColor: colors.surface },
  btn: { marginTop: 12, borderRadius: 12 },
  link: { marginTop: 14, color: colors.accent, fontWeight: '600' },
});
