import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APP_NAME, APP_TAGLINE, loginSchema, type LoginInput } from '@siteflow/shared';
import { useAuth } from '@/auth/AuthContext';
import {
  getApiBaseUrl,
  hydrateApiBaseUrl,
  setApiBaseUrlOverride,
} from '@/api/apiUrl';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/lib/utils';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [showApi, setShowApi] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  useEffect(() => {
    void hydrateApiBaseUrl().then((url) => setApiUrl(url));
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const saveApiUrl = async () => {
    setApiMessage(null);
    try {
      const saved = await setApiBaseUrlOverride(apiUrl);
      setApiUrl(saved);
      setApiMessage('Server URL saved. Now sign in.');
    } catch (err) {
      setApiMessage(errorMessage(err, 'Could not save server URL'));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      // Persist API URL before login so request uses the latest value
      if (apiUrl.trim()) {
        await setApiBaseUrlOverride(apiUrl);
      }
      await login(values.email, values.password);
    } catch (err) {
      setFormError(errorMessage(err, 'Login failed'));
      setShowApi(true);
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.brand}>{APP_NAME}</Text>
            <Text style={styles.tag}>{APP_TAGLINE}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>Sign in</Text>
            <Text style={styles.sub}>Use your SiteFlow account to continue</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email"
                  mode="outlined"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  style={styles.input}
                  error={!!errors.email}
                />
              )}
            />
            {errors.email ? <HelperText type="error">{errors.email.message}</HelperText> : null}

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Password"
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  style={styles.input}
                  error={!!errors.password}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword((v) => !v)}
                    />
                  }
                />
              )}
            />
            {errors.password ? <HelperText type="error">{errors.password.message}</HelperText> : null}

            <Button mode="text" compact onPress={() => setShowApi((v) => !v)} textColor={colors.primary}>
              {showApi ? 'Hide server URL' : 'Can’t sign in? Set server URL'}
            </Button>

            {showApi ? (
              <View style={styles.apiBox}>
                <Text style={styles.apiLabel}>Server / API URL</Text>
                <TextInput
                  mode="outlined"
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  style={styles.input}
                />
                <Text style={styles.hint}>
                  Paste the link from your admin (ends with /api/v1), then Save & Sign in.
                </Text>
                <Button mode="outlined" onPress={() => void saveApiUrl()} style={styles.apiSave}>
                  Save server URL
                </Button>
                {apiMessage ? <Text style={styles.ok}>{apiMessage}</Text> : null}
              </View>
            ) : null}

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
              Sign in
            </Button>

            <Link href="/(auth)/forgot-password" asChild>
              <Button mode="text" textColor={colors.primary}>
                Forgot password?
              </Button>
            </Link>

            <Link href="/(auth)/register" asChild>
              <Button mode="outlined" textColor={colors.primary} style={styles.register}>
                Create organisation (Admin)
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
  scroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: 24 },
  hero: { paddingHorizontal: 24, paddingBottom: 20 },
  brand: { color: '#fff', fontSize: 36, fontWeight: '800' },
  tag: { color: '#94A3B8', marginTop: 6, fontSize: 15 },
  card: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  heading: { fontSize: 22, fontWeight: '700', color: colors.primary },
  sub: { color: colors.textSecondary, marginBottom: 16, marginTop: 4 },
  input: { marginBottom: 4, backgroundColor: colors.surface },
  btn: { marginTop: 12, borderRadius: 12 },
  register: { marginTop: 4, borderRadius: 12 },
  apiBox: { marginBottom: 8 },
  apiLabel: { fontWeight: '700', color: colors.primary, marginBottom: 6 },
  hint: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  apiSave: { borderRadius: 12, marginBottom: 4 },
  ok: { color: colors.success, fontSize: 13, marginBottom: 4 },
});
