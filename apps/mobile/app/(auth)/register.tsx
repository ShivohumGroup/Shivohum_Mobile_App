import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  APP_NAME,
  registerOrganizationSchema,
  type RegisterOrganizationInput,
} from '@siteflow/shared';
import { useAuth } from '@/auth/AuthContext';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/lib/utils';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterOrganizationScreen() {
  const { registerOrganization } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterOrganizationInput>({
    resolver: zodResolver(registerOrganizationSchema),
    defaultValues: {
      organizationName: '',
      organizationCode: '',
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await registerOrganization({
        ...values,
        organizationCode: values.organizationCode?.trim() || undefined,
        phone: values.phone || null,
      });
    } catch (err) {
      setFormError(errorMessage(err, 'Could not create organisation'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.tag}>Create your construction company</Text>

          <View style={styles.card}>
            <Text style={styles.heading}>Register as Admin</Text>
            <Text style={styles.sub}>
              You become the organisation admin with full rights. Then invite your team from the app.
            </Text>

            {(
              [
                ['organizationName', 'Company / organisation name', false],
                ['organizationCode', 'Short code (optional)', false],
                ['fullName', 'Your full name', false],
                ['email', 'Admin email', false],
                ['phone', 'Phone (optional)', false],
                ['password', 'Password (min 8)', true],
              ] as const
            ).map(([name, label, secure]) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <TextInput
                      label={label}
                      mode="outlined"
                      autoCapitalize={name === 'email' || name === 'organizationCode' ? 'none' : 'words'}
                      keyboardType={name === 'email' ? 'email-address' : name === 'phone' ? 'phone-pad' : 'default'}
                      secureTextEntry={secure}
                      value={value || ''}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      style={styles.input}
                      error={!!errors[name]}
                    />
                    {errors[name] ? (
                      <HelperText type="error">{String(errors[name]?.message)}</HelperText>
                    ) : null}
                  </View>
                )}
              />
            ))}

            {formError ? <HelperText type="error">{formError}</HelperText> : null}

            <Button
              mode="contained"
              onPress={onSubmit}
              loading={submitting}
              disabled={submitting}
              buttonColor={colors.accent}
              style={styles.btn}
              contentStyle={{ height: 48 }}
            >
              Create organisation
            </Button>

            <Link href="/(auth)/login" asChild>
              <Button mode="text" textColor={colors.primary}>
                Already have an account? Sign in
              </Button>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  brand: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 12 },
  tag: { color: '#94A3B8', marginBottom: 16, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  heading: { fontSize: 22, fontWeight: '700', color: colors.primary },
  sub: { color: colors.textSecondary, marginBottom: 12, marginTop: 4, lineHeight: 20 },
  input: { marginBottom: 4, backgroundColor: colors.surface },
  btn: { marginTop: 12, borderRadius: 12 },
});
